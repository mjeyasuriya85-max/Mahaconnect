const path = require("path");

// Load .env from the backend folder, whatever folder you start node from
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

// Your existing database file (it prints "MahaConnect Database Ready")
const db = require("./database");

// Check this path: the file must be backend/routes/otp.routes.js
const otpRoutes = require("./otp.routes");
const chatbotRoutes = require("./chatbot.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware (must come BEFORE routes) ----------
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

// ---------- Routes ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "success", message: "MahaConnect API is working 🚀", pid: process.pid });
});

// OTP routes: POST /api/send-otp, POST /api/verify-otp, GET /api/otp-ping
app.use("/api", otpRoutes);
app.use("/api/chatbot", chatbotRoutes);
/* =========================================
   SERVICE MANAGEMENT CRUD API
========================================= */

// GET all services
// Admin can include inactive services using ?includeInactive=true
app.get("/api/services", (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === "true";

        const services = includeInactive
            ? db.prepare("SELECT * FROM services ORDER BY id DESC").all()
            : db.prepare(
                "SELECT * FROM services WHERE status = 'Active' ORDER BY id DESC"
              ).all();

        const formattedServices = services.map(service => ({
            ...service,
            requiredDocuments: service.requiredDocuments
                ? JSON.parse(service.requiredDocuments)
                : []
        }));

        res.json({
            success: true,
            services: formattedServices
        });

    } catch (error) {
        console.error("GET SERVICES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load services."
        });
    }
});


// ADD new service
app.post("/api/services", (req, res) => {
    try {
        const {
            title,
            category,
            description,
            eligibility,
            requiredDocuments,
            applicationUrl
        } = req.body || {};

        if (
            typeof title !== "string" || !title.trim() ||
            typeof category !== "string" || !category.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Service title and category are required."
            });
        }

        const documents = Array.isArray(requiredDocuments)
            ? requiredDocuments
            : [];

        const now = new Date().toISOString();

        const result = db.prepare(`
            INSERT INTO services (
                title,
                category,
                description,
                eligibility,
                requiredDocuments,
                applicationUrl,
                status,
                createdAt,
                updatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?)
        `).run(
            title.trim(),
            category.trim(),
            typeof description === "string" ? description.trim() : "",
            typeof eligibility === "string" ? eligibility.trim() : "",
            JSON.stringify(documents),
            typeof applicationUrl === "string" ? applicationUrl.trim() : "",
            now,
            now
        );

        res.status(201).json({
            success: true,
            message: "Service added successfully.",
            id: result.lastInsertRowid
        });

    } catch (error) {
        console.error("ADD SERVICE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to add service."
        });
    }
});


// UPDATE service
app.put("/api/services/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID."
            });
        }

        const existing = db.prepare(
            "SELECT * FROM services WHERE id = ?"
        ).get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Service not found."
            });
        }

        const {
            title,
            category,
            description,
            eligibility,
            requiredDocuments,
            applicationUrl,
            status
        } = req.body || {};

        const updatedTitle = title ?? existing.title;
        const updatedCategory = category ?? existing.category;
        const updatedStatus = status ?? existing.status;

        if (
            typeof updatedTitle !== "string" || !updatedTitle.trim() ||
            typeof updatedCategory !== "string" || !updatedCategory.trim() ||
            !["Active", "Inactive"].includes(updatedStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid title, category or status."
            });
        }

        const documents = requiredDocuments === undefined
            ? JSON.parse(existing.requiredDocuments || "[]")
            : Array.isArray(requiredDocuments)
                ? requiredDocuments
                : null;

        if (!documents) {
            return res.status(400).json({
                success: false,
                message: "Required documents must be a list."
            });
        }

        db.prepare(`
            UPDATE services
            SET title = ?,
                category = ?,
                description = ?,
                eligibility = ?,
                requiredDocuments = ?,
                applicationUrl = ?,
                status = ?,
                updatedAt = ?
            WHERE id = ?
        `).run(
            updatedTitle.trim(),
            updatedCategory.trim(),
            description ?? existing.description,
            eligibility ?? existing.eligibility,
            JSON.stringify(documents),
            applicationUrl ?? existing.applicationUrl,
            updatedStatus,
            new Date().toISOString(),
            id
        );

        res.json({
            success: true,
            message: "Service updated successfully."
        });

    } catch (error) {
        console.error("UPDATE SERVICE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update service."
        });
    }
});


// ACTIVATE / DEACTIVATE service
app.patch("/api/services/:id/status", (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body || {};

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !["Active", "Inactive"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid service ID and status are required."
            });
        }

        const result = db.prepare(`
            UPDATE services
            SET status = ?, updatedAt = ?
            WHERE id = ?
        `).run(status, new Date().toISOString(), id);

        if (!result.changes) {
            return res.status(404).json({
                success: false,
                message: "Service not found."
            });
        }

        res.json({
            success: true,
            message: `Service ${status.toLowerCase()} successfully.`
        });

    } catch (error) {
        console.error("SERVICE STATUS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to change service status."
        });
    }
});


// DELETE service
app.delete("/api/services/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID."
            });
        }

        const result = db.prepare(
            "DELETE FROM services WHERE id = ?"
        ).run(id);

        if (!result.changes) {
            return res.status(404).json({
                success: false,
                message: "Service not found."
            });
        }

        res.json({
            success: true,
            message: "Service deleted successfully."
        });

    } catch (error) {
        console.error("DELETE SERVICE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete service."
        });
    }
});
/* =========================================
   SMART RECOMMENDATIONS API
   Prototype sample recommendations
========================================= */

app.post("/api/recommendations", (req, res) => {
    try {
        const { profile, need } = req.body || {};

        if (
            typeof profile !== "string" ||
            typeof need !== "string" ||
            !profile.trim() ||
            !need.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please select your profile and requirement."
            });
        }

        const selectedProfile = profile.trim();
        const selectedNeed = need.trim().toLowerCase();

        const catalog = [
            {
                id: "student-scholarship",
                title: "Student Scholarship Support",
                category: "Education Support",
                description: "Explore scholarship information and education assistance options.",
                profiles: ["student"],
                keywords: ["education", "scholarship", "student"]
            },
            {
                id: "education-services",
                title: "Education Services",
                category: "Education Support",
                description: "Explore education-related services and document requirements.",
                profiles: ["student", "family", "citizen"],
                keywords: ["education", "student"]
            },
            {
                id: "employment-support",
                title: "Employment Support",
                category: "Employment Support",
                description: "Explore employment registration, job-search and career support services.",
                profiles: ["job seeker", "women", "student"],
                keywords: ["employment", "job"]
            },
            {
                id: "skill-development",
                title: "Skill Development Services",
                category: "Employment Support",
                description: "Explore skill-building and career development opportunities.",
                profiles: ["job seeker", "women", "student"],
                keywords: ["employment", "job", "skill"]
            },
            {
                id: "income-certificate",
                title: "Income Certificate",
                category: "Certificate / Document",
                description: "View information about applying for an income certificate.",
                profiles: ["student", "family", "citizen", "women", "farmer"],
                keywords: ["certificate", "document", "income"]
            },
            {
                id: "community-certificate",
                title: "Community Certificate",
                category: "Certificate / Document",
                description: "View information about community certificate services.",
                profiles: ["student", "family", "citizen"],
                keywords: ["certificate", "document", "community"]
            },
            {
                id: "welfare-services",
                title: "Citizen Welfare Services",
                category: "Welfare Support",
                description: "Explore sample welfare services according to your needs.",
                profiles: ["family", "citizen", "women", "senior citizen"],
                keywords: ["welfare", "support"]
            },
            {
                id: "financial-assistance",
                title: "Financial Assistance Information",
                category: "Financial Assistance",
                description: "Explore information about possible financial assistance programmes.",
                profiles: ["student", "family", "citizen", "women", "farmer"],
                keywords: ["financial", "finance", "assistance"]
            },
            {
                id: "pension-services",
                title: "Pension Services",
                category: "Pension Support",
                description: "Explore pension-related service information and eligibility requirements.",
                profiles: ["senior citizen", "family", "citizen"],
                keywords: ["pension"]
            },
            {
                id: "farmer-support",
                title: "Farmer Support Services",
                category: "Welfare Support",
                description: "Explore sample agriculture and farmer assistance service information.",
                profiles: ["farmer"],
                keywords: ["welfare", "financial", "finance", "assistance"]
            },
            {
                id: "women-support",
                title: "Women Support Services",
                category: "Welfare Support",
                description: "Explore sample welfare, skills and support service information.",
                profiles: ["women"],
                keywords: ["welfare", "support", "financial", "assistance"]
            },
            {
                id: "citizen-services",
                title: "General Citizen Services",
                category: "Welfare Support",
                description: "Explore general citizen services and application information.",
                profiles: ["family", "citizen", "senior citizen"],
                keywords: ["welfare", "support"]
            }
        ];

        const matchingResults = catalog.filter((item) =>
            item.keywords.some((keyword) =>
                selectedNeed.includes(keyword)
            )
        );

        // Prefer items relevant to the selected profile.
        matchingResults.sort((a, b) => {
            const profileA = a.profiles.some((p) =>
                selectedProfile.toLowerCase().includes(p)
            );
            const profileB = b.profiles.some((p) =>
                selectedProfile.toLowerCase().includes(p)
            );

            return Number(profileB) - Number(profileA);
        });

        const recommendations = matchingResults.slice(0, 4).map((item) => ({
            id: item.id,
            title: item.title,
            name: item.title,
            service: item.title,
            category: item.category,
            description: item.description,
            reason: "Suggested based on your selected profile and requirement.",
            eligibility: "Check the relevant authority's official rules before applying."
        }));

        return res.json({
            success: true,
            profile: selectedProfile,
            need: need.trim(),
            recommendations,
            message: recommendations.length
                ? "Sample recommendations generated successfully."
                : "No matching sample services found. Try another requirement."
        });

    } catch (error) {
        console.error("RECOMMENDATIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate recommendations."
        });
    }
});

// ---------- JSON 404 (keep at the very end of the routes) ----------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `No route for ${req.method} ${req.originalUrl}`,
    pid: process.pid
  });
});

// ---------- Start ----------
const server = app.listen(PORT, () => {
  console.log(`MahaConnect Backend running on http://localhost:${PORT} (PID ${process.pid})`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Run: lsof -nP -iTCP:${PORT} -sTCP:LISTEN  then kill the PID.`
    );
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});