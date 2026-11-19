const express = require("express");
const db = require("./database");

const {
    detectIntent
} = require("./nlp/intentDetector");

const {
    normalizeText,
    tokenizeText
} = require("./nlp/textProcessor");

const router = express.Router();

/* =====================================
   DOCUMENT PARSER
===================================== */

function parseDocuments(documents) {
    if (!documents) return [];

    if (Array.isArray(documents)) {
        return documents;
    }

    try {
        const parsed = JSON.parse(documents);

        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (error) {
        // If not JSON, handle as comma-separated text.
    }

    return String(documents)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

/* =====================================
   REMOVE COMMON CHAT WORDS
===================================== */

const stopWords = new Set([
    "i", "me", "my", "we", "you", "your",
    "the", "a", "an", "is", "are", "am",
    "for", "to", "of", "in", "on", "and",
    "or", "what", "which", "where", "when",
    "how", "can", "could", "do", "does",
    "tell", "please", "need", "want", "get",
    "about", "details", "information",
    "apply", "application", "process",
    "enaku", "enakku", "venum", "vayum",
    "epdi", "eppadi", "epdiya", "pannanum",
    "pannurathu", "pannrathu", "iruku",
    "irukku", "sollunga", "solunga",
    "pathi", "oru", "thevai", "thevaiya",
    "kidaikuma", "kidaikkuma", "ku",
    "kaaga", "enna", "epothu"
]);

/* =====================================
   GET MEANINGFUL WORDS
===================================== */

function getMeaningfulTokens(message) {
    return [
        ...new Set(
            tokenizeText(normalizeText(message))
                .filter(token =>
                    token.length > 1 &&
                    !stopWords.has(token)
                )
        )
    ];
}

/* =====================================
   DYNAMIC SERVICE SEARCH
===================================== */

function findBestService(message) {

    const queryTokens = getMeaningfulTokens(message);

    if (queryTokens.length === 0) {
        return {
            service: null,
            ambiguous: false
        };
    }

    const services = db.prepare(`
        SELECT *
        FROM services
        WHERE status = 'Active'
    `).all();

    if (services.length === 0) {
        return {
            service: null,
            ambiguous: false
        };
    }

    const scoredServices = services.map(service => {

        const titleTokens = getMeaningfulTokens(
            service.title || ""
        );

        const categoryTokens = getMeaningfulTokens(
            service.category || ""
        );

        const descriptionTokens = getMeaningfulTokens(
            service.description || ""
        );

        let totalScore = 0;

        queryTokens.forEach(token => {

            if (titleTokens.includes(token)) {
                totalScore += 4;
            } else if (categoryTokens.includes(token)) {
                totalScore += 3;
            } else if (descriptionTokens.includes(token)) {
                totalScore += 1;
            }

        });

        const score =
            totalScore / (queryTokens.length * 4);

        return {
            service,
            score
        };
    });

    scoredServices.sort(
        (a, b) => b.score - a.score
    );

    const best = scoredServices[0];
    const second = scoredServices[1];

    if (!best || best.score < 0.25) {
        return {
            service: null,
            ambiguous: false
        };
    }

    if (
        second &&
        second.score >= 0.25 &&
        Math.abs(best.score - second.score) < 0.08
    ) {
        return {
            service: null,
            ambiguous: true
        };
    }

    return {
        service: best.service,
        ambiguous: false
    };
}

/* =====================================
   FORMAT SERVICE INFORMATION
===================================== */

function formatServiceResponse(service) {

    const documents = parseDocuments(
        service.requiredDocuments
    );

    let reply = `**${service.title}**\n\n`;

    reply += `${service.description || "Description not available."}\n\n`;

    reply += `**Category:** ${service.category || "Not specified"}\n\n`;

    reply += `**Eligibility:**\n${service.eligibility || "Please check the official department rules."}\n\n`;

    reply += `**Required Documents:**\n`;

    if (documents.length > 0) {
        documents.forEach((document, index) => {
            reply += `${index + 1}. ${document}\n`;
        });
    } else {
        reply += "Document information is not available yet.\n";
    }

    if (service.applicationUrl) {
        reply += `\n**Application Link:** ${service.applicationUrl}`;
    } else {
        reply += "\nApplication link is not available in the service record yet.";
    }

    return reply;
}

/* =====================================
   SHOW ALL ACTIVE SERVICES
===================================== */

function getAllServicesResponse() {

    const services = db.prepare(`
        SELECT id, title, category
        FROM services
        WHERE status = 'Active'
        ORDER BY title ASC
    `).all();

    if (services.length === 0) {
        return "Currently, no active services are available.";
    }

    let reply = "**MahaConnect Available Services**\n\n";

    services.forEach((service, index) => {
        reply += `${index + 1}. **${service.title}**`;
        reply += ` - ${service.category}\n`;
    });

    reply += "\nPlease type a service name to know its eligibility, documents and application details.";

    return reply;
}

/* =====================================
   APPLICATION STATUS
===================================== */

function getApplicationStatus(message) {

    const match = message.match(
        /\b[A-Z]{2,5}\d{4,}[A-Z0-9]*\b/i
    );

    if (!match) {
        return "Please enter your application ID to check the status.";
    }

    const applicationId = match[0].toUpperCase();

    const application = db.prepare(`
        SELECT *
        FROM applications
        WHERE UPPER(id) = ?
    `).get(applicationId);

    if (!application) {
        return `No application found with ID ${applicationId}. Please check your application ID.`;
    }

    return `**Application Details**\n\nApplication ID: ${application.id}\nService: ${application.service || application.serviceType || "Not available"}\nStatus: ${application.status || "Pending"}`;
}

/* =====================================
   CHATBOT MESSAGE API
===================================== */

router.post("/message", (req, res) => {

    try {

        const message = req.body.message;

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                reply: "Please enter your message."
            });
        }

        const cleanMessage = message.trim();

        const normalized = normalizeText(cleanMessage);

        const detected = detectIntent(cleanMessage);

        const intent = detected.intent;

        let reply = "";
        let service = null;

        /* GREETING */

        if (intent === "GREETING") {

            reply = "Vanakkam! Welcome to MahaConnect. I can help you find government services, eligibility, required documents and application information.";

        }

        /* HELP */

        else if (intent === "HELP") {

            reply = "I am MahaConnect Government Service Assistant. You can ask me about any service available in our database. For example, ask about eligibility, required documents or application details.";

        }

        /* LIST ALL SERVICES */

        else if (
            /available services|list services|all services|what services|services available|enna services|services irukka|services iruku/.test(normalized)
        ) {

            reply = getAllServicesResponse();

        }

        /* APPLICATION STATUS */

        else if (intent === "APPLICATION_STATUS") {

            reply = getApplicationStatus(cleanMessage);

        }

        /* HUMAN SUPPORT */

        else if (intent === "HUMAN_SUPPORT") {

            reply = "For further assistance, please contact the concerned government department or support team.";

        }

        /* DYNAMIC SERVICE MATCHING */

        else {

            const result = findBestService(cleanMessage);

            if (result.ambiguous) {

                reply = "I found more than one matching service. Please enter the exact service name so I can provide the correct information.";

            } else if (result.service) {

                service = result.service;

                reply = formatServiceResponse(service);

            } else if (intent === "DOCUMENTS") {

                reply = "Please mention the service name. For example: 'Scholarship required documents' or 'Community Certificate documents'.";

            } else {

                reply = "I couldn't find a matching active service in the MahaConnect service records. Please try the service name or contact the concerned department. The administrator may need to add this service.";

            }

        }

        return res.json({
            success: true,
            intent,
            confidence: detected.confidence,
            reply,
            service: service
                ? {
                    id: service.id,
                    title: service.title,
                    category: service.category,
                    description: service.description,
                    eligibility: service.eligibility,
                    requiredDocuments: parseDocuments(
                        service.requiredDocuments
                    ),
                    applicationUrl: service.applicationUrl || ""
                }
                : null
        });

    } catch (error) {

        console.error("Chatbot Error:", error);

        return res.status(500).json({
            success: false,
            reply: "Something went wrong. Please try again later."
        });

    }

});

module.exports = router;