const natural = require("natural");

const tokenizer = new natural.WordTokenizer();

function normalizeText(message) {
    if (typeof message !== "string") {
        return "";
    }

    return message
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenizeText(message) {
    const normalized = normalizeText(message);

    if (!normalized) {
        return [];
    }

    return tokenizer.tokenize(normalized);
}

module.exports = {
    normalizeText,
    tokenizeText
};