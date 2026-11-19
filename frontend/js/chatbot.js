
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");

const API_BASE_URL = "http://127.0.0.1:5000/api";

let currentService = null;
let conversationStep = 0;
let isProcessing = false;


// ===============================
// ADD USER MESSAGE
// ===============================

function addUserMessage(message) {

    const div = document.createElement("div");
    div.className = "message user-message";

    const content = document.createElement("div");
    content.className = "message-content";

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    content.appendChild(paragraph);
    div.appendChild(content);

    chatMessages.appendChild(div);

    scrollChat();
}


// ===============================
// ADD BOT MESSAGE
// ===============================

function addBotMessage(message) {

    const div = document.createElement("div");
    div.className = "message bot-message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const content = document.createElement("div");
    content.className = "message-content";

    const paragraph = document.createElement("p");
    paragraph.textContent = String(message || "");
    paragraph.style.whiteSpace = "pre-wrap";

    content.appendChild(paragraph);

    div.appendChild(avatar);
    div.appendChild(content);

    chatMessages.appendChild(div);

    scrollChat();
}


// ===============================
// QUICK BUTTONS
// ===============================

function addQuickButtons(buttons) {

    const container = document.createElement("div");
    container.className = "quick-options dynamic-options";

    buttons.forEach(button => {

        const btn = document.createElement("button");

        btn.type = "button";
        btn.textContent = button.text;

        btn.onclick = button.action;

        container.appendChild(btn);

    });

    chatMessages.appendChild(container);

    scrollChat();
}


// ===============================
// VOICE INPUT
// ===============================

function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        addBotMessage(
            "⚠️ Voice input is not supported in this browser. Please use Chrome."
        );

        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {

        const voiceButton =
            document.getElementById("voiceButton");

        if (voiceButton) {
            voiceButton.textContent = "🔴";
            voiceButton.title = "Listening...";
        }

    };

    recognition.onresult = function(event) {

        const spokenText =
            event.results[0][0].transcript;

        userInput.value = spokenText;

        sendMessage();

    };

    recognition.onerror = function(event) {

        console.log("Voice recognition error:", event.error);

        addBotMessage(
            "⚠️ I couldn't hear that clearly. Please try again."
        );

    };

    recognition.onend = function() {

        const voiceButton =
            document.getElementById("voiceButton");

        if (voiceButton) {
            voiceButton.textContent = "🎙️";
            voiceButton.title = "Speak";
        }

    };

    recognition.start();

}


// ===============================
// SEND MESSAGE
// ===============================

function sendMessage() {

    const message = userInput.value.trim();

    if (message === "" || isProcessing) {
        return;
    }

    addUserMessage(message);

    userInput.value = "";

    // Application ID tracking
    if (conversationStep === 10) {

        conversationStep = 0;

        checkApplicationStatus(message);

        return;
    }

    processUserMessage(message);

}


// ===============================
// ENTER KEY
// ===============================

userInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});


// ===============================
// BACKEND NLP CONNECTION
// ===============================

async function processUserMessage(message) {

    if (isProcessing) {
        return;
    }

    isProcessing = true;

    const loadingMessage = document.createElement("div");

    loadingMessage.className = "message bot-message";

    loadingMessage.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <p>⏳ Checking government services...</p>
        </div>
    `;

    chatMessages.appendChild(loadingMessage);

    scrollChat();

    try {

        const response = await fetch(
            `${API_BASE_URL}/chatbot/message`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );

        const data = await response.json();

        loadingMessage.remove();

        if (!response.ok || !data.success) {

            addBotMessage(
                data.reply ||
                "Sorry, something went wrong. Please try again."
            );

            return;
        }

        // Display actual backend NLP response
        addBotMessage(
            data.reply ||
            "I couldn't find a response. Please try again."
        );

        // Save selected service if backend returns it
        if (data.service && data.service.title) {
            currentService = data.service.title;
        }

        console.log("MahaConnect Backend Response:", data);

    } catch (error) {

        if (loadingMessage.parentNode) {
            loadingMessage.remove();
        }

        console.error("Chatbot API Error:", error);

        addBotMessage(
            "⚠️ Unable to connect to MahaConnect server. Please check whether your backend is running."
        );

    } finally {

        isProcessing = false;

    }

}


// ===============================
// MAIN SERVICES
// ===============================

function showMainServices() {

    addBotMessage(
        "I can help you find government services, check application status, understand required documents and get assistance."
    );

    addQuickButtons([

        {
            text: "🔍 Find a Government Service",
            action: showAllServices
        },

        {
            text: "📍 Track Application",
            action: showApplicationStatus
        },

        {
            text: "📄 Required Documents",
            action: showDocuments
        },

        {
            text: "👩‍💼 Human Help",
            action: showHumanSupport
        }

    ]);

}


// ===============================
// FIND ALL DATABASE SERVICES
// ===============================

function showAllServices() {

    processUserMessage("Show all available services");

}


// ===============================
// SERVICE SELECTION
// ===============================

function selectService(service) {

    currentService = service;

    addUserMessage(service);

    processUserMessage(service);

}


// ===============================
// DOCUMENTS
// ===============================

function showDocuments() {

    if (currentService) {

        processUserMessage(
            "What documents are required for " + currentService + "?"
        );

    } else {

        processUserMessage(
            "What documents are required?"
        );

    }

}


// ===============================
// APPLICATION STATUS
// ===============================

function showApplicationStatus() {

    addBotMessage(
        "📍 Please enter your application ID, for example MC2026001."
    );

    conversationStep = 10;

}


async function checkApplicationStatus(applicationId) {

    addBotMessage("🔍 Checking your application status...");

    try {

        const response = await fetch(
            `${API_BASE_URL}/applications`
        );

        if (!response.ok) {
            throw new Error("Unable to fetch applications.");
        }

        const data = await response.json();

        const applications = Array.isArray(data)
            ? data
            : data.applications || [];

        const application = applications.find(app =>
            app.id &&
            app.id.toLowerCase() === applicationId.toLowerCase()
        );

        if (!application) {

            addBotMessage(
                "❌ Application not found. Please check your Application ID and try again."
            );

            addQuickButtons([

                {
                    text: "📍 Try Again",
                    action: showApplicationStatus
                },

                {
                    text: "🏠 Back to Services",
                    action: showMainServices
                }

            ]);

            return;
        }

        addBotMessage(
            `✅ Application Found!

Application ID: ${application.id}
Service: ${application.service}
Status: ${application.status}
Date: ${application.date || "Not available"}`
        );

        addQuickButtons([

            {
                text: "📍 Check Another Application",
                action: showApplicationStatus
            },

            {
                text: "🏠 Back to Services",
                action: showMainServices
            }

        ]);

    } catch (error) {

        console.error("Application Status Error:", error);

        addBotMessage(
            "⚠️ I couldn't connect to the application server. Please try again."
        );

    }

}


// ===============================
// HELP
// ===============================

function showHelp() {

    processUserMessage("Help me with government services");

}


// ===============================
// HUMAN SUPPORT
// ===============================

function showHumanSupport() {

    processUserMessage(
        "I need human support or an officer"
    );

}


// ===============================
// UNKNOWN QUESTION
// ===============================

function showUnknownQuestion() {

    processUserMessage(
        "Show all available services"
    );

}


// ===============================
// START APPLICATION
// ===============================

function startApplication(service) {

    if (!service) {

        addBotMessage(
            "Please select a government service first."
        );

        return;
    }

    currentService = service;

    addBotMessage(
        `You selected ${service}. You can continue to the application page.`
    );

    addQuickButtons([

        {
            text: "Continue Application →",

            action: () => {

                window.location.href =
                    "application.html?service=" +
                    encodeURIComponent(service);

            }
        },

        {
            text: "Cancel",
            action: showMainServices
        }

    ]);

}


// ===============================
// SCROLL
// ===============================

function scrollChat() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


// ===============================
// RESTART
// ===============================

function restartChat() {

    chatMessages.innerHTML = "";

    currentService = null;

    conversationStep = 0;

    isProcessing = false;

    addBotMessage(
        "Hello! 👋 I'm the MahaConnect Government Service Assistant. How can I help you today?"
    );

    showMainServices();

}
