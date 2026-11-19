
const express = require("express");
const twilio = require("twilio");

const router = express.Router();

function isValidPhone(phone) {
    return typeof phone === "string" &&
        /^\+[1-9]\d{7,14}$/.test(phone);
}

function getTwilioClient() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
        const error = new Error(
            "Twilio Account SID or Auth Token missing in backend/.env"
        );
        error.isConfig = true;
        throw error;
    }

    return twilio(sid, token);
}

function handleError(res, error, action) {
    console.error(
        `${action} ERROR:`,
        error.status || "",
        error.code || "",
        error.message
    );

    if (error.isConfig) {
        return res.status(500).json({
            success: false,
            source: "config",
            message: error.message
        });
    }

    if (error.code || error.status) {
        return res.status(error.status === 429 ? 429 : 502).json({
            success: false,
            source: "twilio",
            twilioCode: error.code || null,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        source: "server",
        message: "Unexpected server error."
    });
}

// Check configuration without exposing secrets.
router.get("/otp-ping", (req, res) => {
    res.json({
        success: true,
        routes: [
            "POST /api/send-otp",
            "POST /api/verify-otp"
        ],
        envPresent: {
            TWILIO_ACCOUNT_SID: Boolean(process.env.TWILIO_ACCOUNT_SID),
            TWILIO_AUTH_TOKEN: Boolean(process.env.TWILIO_AUTH_TOKEN),
            TWILIO_VERIFY_SERVICE_SID:
                Boolean(process.env.TWILIO_VERIFY_SERVICE_SID)
        }
    });
});

// Send SMS OTP.
router.post("/send-otp", async (req, res) => {
    try {
        const { email, password, phone } = req.body || {};

        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password ||
            !isValidPhone(phone)
        ) {
            return res.status(400).json({
                success: false,
                source: "validation",
                message:
                    "Enter email, password and mobile number with country code, e.g. +919876543210."
            });
        }

        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!serviceSid) {
            return res.status(500).json({
                success: false,
                source: "config",
                message:
                    "TWILIO_VERIFY_SERVICE_SID is missing in backend/.env"
            });
        }

        const client = getTwilioClient();

        const verification = await client.verify.v2
            .services(serviceSid)
            .verifications.create({
                to: phone,
                channel: "sms"
            });

        return res.status(200).json({
            success: true,
            message: "OTP request accepted. Check your SMS messages.",
            verificationStatus: verification.status
        });
    } catch (error) {
        return handleError(res, error, "SEND OTP");
    }
});

// Verify SMS OTP.
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, phone, otp } = req.body || {};

        if (
            typeof email !== "string" ||
            !email.trim() ||
            !isValidPhone(phone) ||
            !/^\d{6}$/.test(String(otp || ""))
        ) {
            return res.status(400).json({
                success: false,
                source: "validation",
                message:
                    "Enter your email, valid mobile number and 6-digit OTP."
            });
        }

        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!serviceSid) {
            return res.status(500).json({
                success: false,
                source: "config",
                message:
                    "TWILIO_VERIFY_SERVICE_SID is missing in backend/.env"
            });
        }

        const client = getTwilioClient();

        const check = await client.verify.v2
            .services(serviceSid)
            .verificationChecks.create({
                to: phone,
                code: String(otp)
            });

        if (check.status !== "approved") {
            return res.status(400).json({
                success: false,
                source: "verification",
                message: "OTP incorrect or expired. Request a new OTP."
            });
        }

        // OTP is verified, but this route does not yet create
        // an authenticated login session.
        return res.status(200).json({
            success: true,
            status: "success",
            message: "OTP verified successfully."
        });
    } catch (error) {
        return handleError(res, error, "VERIFY OTP");
    }
});

module.exports = router;
