const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");

let currentService = null;
let conversationStep = 0;


// ===============================
// ADD USER MESSAGE
// ===============================

function addUserMessage(message) {

    const div = document.createElement("div");

    div.className = "message user-message";

    div.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;

    chatMessages.appendChild(div);

    scrollChat();
}


// ===============================
// ADD BOT MESSAGE
// ===============================

function addBotMessage(message) {

    const div = document.createElement("div");

    div.className = "message bot-message";

    div.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;

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

        voiceButton.textContent = "🔴";
        voiceButton.title = "Listening...";

    };


    recognition.onresult = function(event) {

        const spokenText =
            event.results[0][0].transcript;

        userInput.value = spokenText;

        // Automatically send the voice message
        sendMessage();

    };


    recognition.onerror = function(event) {

        console.log(
            "Voice recognition error:",
            event.error
        );

        addBotMessage(
            "⚠️ I couldn't hear that clearly. Please try again."
        );

    };


    recognition.onend = function() {

        const voiceButton =
            document.getElementById("voiceButton");

        voiceButton.textContent = "🎙️";
        voiceButton.title = "Speak";

    };


    recognition.start();

}
// ===============================
// SEND MESSAGE
// ===============================
function sendMessage() {

    const message = userInput.value.trim();

    if (message === "") return;

    addUserMessage(message);

    userInput.value = "";


    // APPLICATION STATUS CHECK

    if (conversationStep === 10) {

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

function processUserMessage(message) {

    const text = message.toLowerCase();

    const words = text.split(/\s+/);
    // ---------------------------
    // NATURAL LANGUAGE QUESTIONS
    // ---------------------------

    if (
        text.includes("how can i apply") ||
        text.includes("how to apply") ||
        text.includes("how do i apply") ||
        text.includes("i want to apply") ||
        text.includes("can i apply")
    ) {

        if (text.includes("income")) {
            currentService = "Income Certificate";
            showIncomeCertificate();
            return;
        }

        if (text.includes("community") || text.includes("caste")) {
            currentService = "Community Certificate";
            showCommunityCertificate();
            return;
        }

        if (text.includes("scholarship")) {
            currentService = "Scholarship";
            showScholarship();
            return;
        }

        if (text.includes("pension")) {
            currentService = "Pension";
            showPension();
            return;
        }

        if (text.includes("job") || text.includes("employment")) {
            currentService = "Employment Service";
            showEmployment();
            return;
        }
    }

    // ---------------------------
    // GREETING
    // ---------------------------

    if (
        text.includes("hello") ||
        text.includes("hi") ||
        text.includes("hey") ||
        text.includes("vanakkam")
    ) {

        addBotMessage(
            "Hello! 👋 I'm the MahaConnect Government Service Assistant. How can I help you today?"
        );

        showMainServices();

        return;
    }


    // ---------------------------
    // INCOME CERTIFICATE
    // ---------------------------

    if (
        text.includes("income certificate") ||
        text.includes("income cert") ||
        text.includes("income")
    ) {

        currentService = "Income Certificate";

        showIncomeCertificate();

        return;
    }


    // ---------------------------
    // COMMUNITY CERTIFICATE
    // ---------------------------

    if (
        text.includes("community certificate") ||
        text.includes("caste certificate") ||
        text.includes("community")
    ) {

        currentService = "Community Certificate";

        showCommunityCertificate();

        return;
    }


    // ---------------------------
    // SCHOLARSHIP
    // ---------------------------

    if (
        text.includes("scholarship") ||
        text.includes("student scholarship") ||
        text.includes("education scholarship")
    ) {

        currentService = "Scholarship";

        showScholarship();

        return;
    }


    // ---------------------------
    // EMPLOYMENT
    // ---------------------------

    if (
        text.includes("job") ||
        text.includes("employment") ||
        text.includes("work")
    ) {

        currentService = "Employment Service";

        showEmployment();

        return;
    }


    // ---------------------------
    // PENSION
    // ---------------------------

    if (
        text.includes("pension") ||
        text.includes("old age pension")
    ) {

        currentService = "Pension";

        showPension();

        return;
    }


    // ---------------------------
    // APPLICATION STATUS
    // ---------------------------

    if (
        text.includes("application status") ||
        text.includes("status") ||
        text.includes("track application") ||
        text.includes("track my application")
    ) {

        showApplicationStatus();

        return;
    }


    // ---------------------------
    // DOCUMENTS
    // ---------------------------

    if (
        text.includes("document") ||
        text.includes("documents") ||
        text.includes("what should i submit") ||
        text.includes("what documents")
    ) {

        showDocuments();

        return;
    }


    // ---------------------------
    // HELP
    // ---------------------------

    if (
        text.includes("help") ||
        text.includes("what can you do") ||
        text.includes("how can you help")
    ) {

        showHelp();

        return;
    }


    // ---------------------------
    // HUMAN SUPPORT
    // ---------------------------

    if (
        text.includes("human") ||
        text.includes("agent") ||
        text.includes("officer") ||
        text.includes("customer support")
    ) {

        showHumanSupport();

        return;
    }


    // ---------------------------
    // UNKNOWN QUESTION
    // ---------------------------

    showUnknownQuestion();

}


// ===============================
// MAIN SERVICES
// ===============================

function showMainServices() {

    addBotMessage(
        "I can help you with certificates, scholarships, employment, pension, welfare services and application tracking."
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

function showAllServices() {

    addBotMessage(
        "Sure! 🔍 Which type of government service are you looking for?"
    );

    addQuickButtons([

        {
            text: "🎓 Education",
            action: () => showServiceCategory("Education")
        },

        {
            text: "📄 Certificates",
            action: () => showServiceCategory("Certificates")
        },

        {
            text: "💼 Employment",
            action: () => showServiceCategory("Employment")
        },

        {
            text: "👨‍👩‍👧 Welfare",
            action: () => showServiceCategory("Welfare")
        },

        {
            text: "🌾 Agriculture",
            action: () => showServiceCategory("Agriculture")
        },

        {
            text: "🏥 Health",
            action: () => showServiceCategory("Health")
        },

        {
            text: "🏠 Housing",
            action: () => showServiceCategory("Housing")
        },

        {
            text: "📋 Other Services",
            action: () => showServiceCategory("Other")
        }

    ]);
}

}
// ===============================
// SERVICE CATEGORY
// ===============================

function showServiceCategory(category) {

    addBotMessage(
        `Here are the available ${category} services. Please select a service:`
    );

    if (category === "Education") {

        addQuickButtons([

            {
                text: "🎓 Scholarship",
                action: () => selectService("Scholarship")
            },

            {
                text: "🏫 Education Assistance",
                action: () => selectService("Education Assistance")
            },

            {
                text: "📚 Student Welfare Scheme",
                action: () => selectService("Student Welfare Scheme")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else if (category === "Certificates") {

        addQuickButtons([

            {
                text: "💰 Income Certificate",
                action: () => selectService("Income Certificate")
            },

            {
                text: "📄 Community Certificate",
                action: () => selectService("Community Certificate")
            },

            {
                text: "🏠 Residence Certificate",
                action: () => selectService("Residence Certificate")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else if (category === "Employment") {

        addQuickButtons([

            {
                text: "💼 Employment Registration",
                action: () => selectService("Employment Service")
            },

            {
                text: "💼 Job Assistance",
                action: () => selectService("Job Assistance")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else if (category === "Welfare") {

        addQuickButtons([

            {
                text: "👴 Pension",
                action: () => selectService("Pension")
            },

            {
                text: "👨‍👩‍👧 Welfare Scheme",
                action: () => selectService("Welfare Scheme")
            },

            {
                text: "🤝 Social Assistance",
                action: () => selectService("Social Assistance")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else if (category === "Agriculture") {

        addQuickButtons([

            {
                text: "🌾 Farmer Scheme",
                action: () => selectService("Farmer Scheme")
            },

            {
                text: "🌱 Agricultural Assistance",
                action: () => selectService("Agricultural Assistance")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else if (category === "Health") {

        addQuickButtons([

            {
                text: "🏥 Health Scheme",
                action: () => selectService("Health Scheme")
            },

            {
                text: "💊 Medical Assistance",
                action: () => selectService("Medical Assistance")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else if (category === "Housing") {

        addQuickButtons([

            {
                text: "🏠 Housing Scheme",
                action: () => selectService("Housing Scheme")
            },

            {
                text: "🏘️ Housing Assistance",
                action: () => selectService("Housing Assistance")
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }

    else {

        addQuickButtons([

            {
                text: "📋 Other Government Services",
                action: () => {

                    addBotMessage(
                        "You can search for the government service you need using the chat."
                    );

                }
            },

            {
                text: "⬅️ Back",
                action: showAllServices
            }

        ]);

    }
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
// INCOME
// ===============================

function showIncomeCertificate() {

    addBotMessage(
        "Sure! I can help you with an Income Certificate. 💰 Do you want to apply for it?"
    );

    addQuickButtons([

        {
            text: "Yes, Apply",
            action: () => startApplication("Income Certificate")
        },

        {
            text: "Required Documents",
            action: showDocuments
        },

        {
            text: "Back to Services",
            action: showMainServices
        }

    ]);
}


// ===============================
// COMMUNITY
// ===============================

function showCommunityCertificate() {

    addBotMessage(
        "Sure! I can help you with a Community Certificate. 📄 Would you like to apply?"
    );

    addQuickButtons([

        {
            text: "Yes, Apply",
            action: () => startApplication("Community Certificate")
        },

        {
            text: "Required Documents",
            action: showDocuments
        },

        {
            text: "Back to Services",
            action: showMainServices
        }

    ]);
}


// ===============================
// SCHOLARSHIP
// ===============================

function showScholarship() {

    addBotMessage(
        "I can help you find suitable scholarship services. 🎓 Are you currently a student?"
    );

    addQuickButtons([

        {
            text: "Yes",
            action: () => {

                addUserMessage("Yes");

                addBotMessage(
                    "Great! What is your current education level?"
                );

                addQuickButtons([

                    {
                        text: "School",
                        action: () => scholarshipLevel("School")
                    },

                    {
                        text: "College",
                        action: () => scholarshipLevel("College")
                    }

                ]);

            }
        },

        {
            text: "No",
            action: () => {

                addUserMessage("No");

                addBotMessage(
                    "No problem. I can help you with other government services."
                );

                showMainServices();

            }
        }

    ]);
}


// ===============================
// SCHOLARSHIP LEVEL
// ===============================

function scholarshipLevel(level) {

    addUserMessage(level);

    addBotMessage(
        `Thanks! Based on your ${level.toLowerCase()} education, I can guide you toward relevant scholarship services.`
    );

    addQuickButtons([

        {
            text: "Apply for Scholarship",
            action: () => startApplication("Scholarship")
        },

        {
            text: "Back to Services",
            action: showMainServices
        }

    ]);
}


// ===============================
// EMPLOYMENT
// ===============================

function showEmployment() {

    addBotMessage(
        "I can help you with employment-related government services. 💼 Are you looking for a job opportunity or employment registration?"
    );

    addQuickButtons([

        {
            text: "Job Opportunities",
            action: () => {

                addUserMessage("Job Opportunities");

                addBotMessage(
                    "You can explore suitable employment services through MahaConnect."
                );

                addQuickButtons([

                    {
                        text: "Continue",
                        action: () => startApplication("Employment Service")
                    },

                    {
                        text: "Back",
                        action: showMainServices
                    }

                ]);

            }
        },

        {
            text: "Employment Registration",
            action: () => startApplication("Employment Service")
        }

    ]);
}


// ===============================
// PENSION
// ===============================

function showPension() {

    addBotMessage(
        "I can help you with pension-related government services. 👴 Would you like to start an application?"
    );

    addQuickButtons([

        {
            text: "Yes, Apply",
            action: () => startApplication("Pension")
        },

        {
            text: "Required Documents",
            action: showDocuments
        },

        {
            text: "Back",
            action: showMainServices
        }

    ]);
}


// ===============================
// DOCUMENTS
// ===============================

function showDocuments() {

    addBotMessage(
        "The required documents depend on the service you are applying for. Which service are you applying for?"
    );

    addQuickButtons([

        {
            text: "Income Certificate",
            action: () => {

                addUserMessage("Income Certificate");

                addBotMessage(
                    "I can guide you through the required information and documents for the Income Certificate application."
                );

            }
        },

        {
            text: "Community Certificate",
            action: () => {

                addUserMessage("Community Certificate");

                addBotMessage(
                    "I can guide you through the required information and documents for the Community Certificate application."
                );

            }
        },

        {
            text: "Scholarship",
            action: () => {

                addUserMessage("Scholarship");

                addBotMessage(
                    "Scholarship requirements can vary based on the scheme and eligibility."
                );

            }
        }

    ]);
}


// ===============================
// APPLICATION STATUS
// ===============================

function showApplicationStatus() {

    addBotMessage(
        "Sure! 📍 Please enter your application ID, for example MC2026001."
    );

    conversationStep = 10;

}
async function checkApplicationStatus(applicationId) {

    addBotMessage("🔍 Checking your application status...");

    try {

        const response = await fetch(
            "http://localhost:5000/api/applications"
        );

        const data = await response.json();

        const application = data.applications.find(
            app => app.id.toLowerCase() === applicationId.toLowerCase()
        );


        if (!application) {

            addBotMessage(
                "❌ Application not found. Please check your Application ID and try again."
            );

            return;
        }


        addBotMessage(
            `✅ Application Found!<br><br>
            <strong>Application ID:</strong> ${application.id}<br>
            <strong>Service:</strong> ${application.service}<br>
            <strong>Status:</strong> ${application.status}<br>
            <strong>Date:</strong> ${application.date}`
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

        console.error(error);

        addBotMessage(
            "⚠️ I couldn't connect to the MahaConnect server. Please try again."
        );
    }

}

// ===============================
// HELP
// ===============================

function showHelp() {

    addBotMessage(
        "I can help you with government services, applications, documents, eligibility guidance and application tracking."
    );

    showMainServices();

}


// ===============================
// HUMAN SUPPORT
// ===============================

function showHumanSupport() {

    addBotMessage(
        "I understand. 👩‍💼 If you need human assistance, you can contact the appropriate government service support or officer."
    );

    addQuickButtons([

        {
            text: "Continue with Chatbot",
            action: showMainServices
        },

        {
            text: "Start Application",
            action: () => startApplication(currentService)
        }

    ]);
}


// ===============================
// UNKNOWN QUESTION
// ===============================

function showUnknownQuestion() {

    addBotMessage(
        "I'm not completely sure about that yet. 🤔 I can help you with government certificates, scholarships, employment, pension, welfare services and application tracking."
    );

    addQuickButtons([

        {
            text: "💰 Income Certificate",
            action: () => selectService("Income Certificate")
        },

        {
            text: "📄 Community Certificate",
            action: () => selectService("Community Certificate")
        },

        {
            text: "🎓 Scholarship",
            action: () => selectService("Scholarship")
        },

        {
            text: "📍 Track Application",
            action: showApplicationStatus
        },

        {
            text: "👩‍💼 Human Help",
            action: showHumanSupport
        }

    ]);
}


// ===============================
// START APPLICATION
// ===============================

function startApplication(service) {

    currentService = service;

    addUserMessage("Yes, I want to apply");

    addBotMessage(
        `Great! Let's start your ${service} application. 🚀`
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
// APPLICATION ID INPUT
// ===============================

userInput.addEventListener("input", function() {

    if (conversationStep === 10) {

        // Waiting for application ID

    }

});


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

    addBotMessage(
        "Hello! 👋 I'm the MahaConnect Government Service Assistant. How can I help you today?"
    );

    showMainServices();

}