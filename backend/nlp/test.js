const { detectIntent } = require("./intentDetector");

const testMessages = [
    "Hello",
    "I need income certificate",
    "Enaku income certificate venum",
    "How to apply for scholarship",
    "I want a job",
    "Track my application",
    "What documents are required?",
    "I need pension support",

    // New tests
    "Show all available services",
    "I need driving licence",
    "Enaku scholarship venum"
];

testMessages.forEach(message => {
    const result = detectIntent(message);

    console.log("\nUser:", message);
    console.log("NLP Result:", result);
});