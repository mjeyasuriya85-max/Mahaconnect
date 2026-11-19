
const {
    normalizeText,
    tokenizeText
} = require("./textProcessor");

const intents = {
    GREETING: [
        "hello", "hi", "hey", "vanakkam", "good morning"
    ],

    ALL_SERVICES: [
        "show all available services",
        "show all services",
        "list all services",
        "list services",
        "available services",
        "all services",
        "what services are available",
        "what services do you provide",
        "show services",
        "enna services irukku",
        "ella services",
        "all service list"
    ],

    INCOME_CERTIFICATE: [
        "income certificate", "income cert",
        "income proof", "varumana certificate", "income"
    ],

    COMMUNITY_CERTIFICATE: [
        "community certificate", "caste certificate",
        "community", "jaathi certificate"
    ],

    SCHOLARSHIP: [
        "scholarship", "student scholarship",
        "education assistance", "kalvi uthavi"
    ],

    EMPLOYMENT: [
        "employment", "job", "job registration",
        "velai", "work"
    ],

    PENSION: [
        "pension", "old age pension", "retirement pension"
    ],

    APPLICATION_STATUS: [
        "application status", "track application",
        "check my status", "status"
    ],

    DOCUMENTS: [
        "required documents", "documents",
        "what documents", "document list"
    ],

    HUMAN_SUPPORT: [
        "human support", "talk to officer",
        "customer support", "contact officer"
    ],

    HELP: [
        "help", "what can you do", "how can you help"
    ]
};

function detectIntent(message) {
    const normalized = normalizeText(message);

    if (!normalized) {
        return { intent: "UNKNOWN", confidence: 0 };
    }

    const tokens = tokenizeText(normalized);

    let bestIntent = "UNKNOWN";
    let bestScore = 0;

    for (const [intent, examples] of Object.entries(intents)) {
        for (const example of examples) {
            const normalizedExample = normalizeText(example);
            const exampleTokens = tokenizeText(normalizedExample);

            let score = 0;

            if (normalized === normalizedExample) {
                score = 1;
            } else if (
                normalized.startsWith(normalizedExample + " ") ||
                normalized.endsWith(" " + normalizedExample) ||
                normalized.includes(" " + normalizedExample + " ")
            ) {
                score = 0.9;
            } else {
                const matchedTokens = exampleTokens.filter(
                    token => tokens.includes(token)
                );

                score = exampleTokens.length
                    ? matchedTokens.length / exampleTokens.length
                    : 0;
            }

            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent;
            }
        }
    }

    if (bestScore >= 0.6) {
        return {
            intent: bestIntent,
            confidence: Number(bestScore.toFixed(2))
        };
    }

    return {
        intent: "SERVICE_QUERY",
        confidence: 0.5
    };
}

module.exports = { detectIntent };
