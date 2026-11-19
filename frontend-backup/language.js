const MahaLanguage = (() => {
    const STORAGE_KEY = "mahaConnectLanguage";

    const translations = {
        en: {
            language: "Language",
            home: "Home",
            services: "Services",
            about: "About",
            login: "Citizen Login",
            dashboard: "Dashboard",
            recommendations: "Smart Recommendations",
            selectLanguage: "Choose your language",
            howItWorks: "How It Works"
        },

        ta: {
            language: "மொழி",
            home: "முகப்பு",
            services: "சேவைகள்",
            about: "எங்களைப் பற்றி",
            login: "குடிமக்கள் உள்நுழைவு",
            dashboard: "முகப்புப் பலகை",
            recommendations: "சேவைப் பரிந்துரைகள்",
            selectLanguage: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
            howItWorks: "இது எவ்வாறு செயல்படுகிறது"
        }
    };

    function getLanguage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return translations[saved] ? saved : "en";
    }

    function setLanguage(language) {
        if (!translations[language]) return;

        localStorage.setItem(STORAGE_KEY, language);
        applyTranslations();

        document.dispatchEvent(
            new CustomEvent("mahaLanguageChanged", {
                detail: { language }
            })
        );
    }

    function applyTranslations() {
        const language = getLanguage();
        const dictionary = translations[language];

        document.documentElement.lang = language;

        document.querySelectorAll("[data-i18n]").forEach(element => {
            const key = element.dataset.i18n;

            if (dictionary[key] !== undefined) {
                element.textContent = dictionary[key];
            }
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
            const key = element.dataset.i18nPlaceholder;

            if (dictionary[key] !== undefined) {
                element.placeholder = dictionary[key];
            }
        });

        document.querySelectorAll("[data-i18n-title]").forEach(element => {
            const key = element.dataset.i18nTitle;

            if (dictionary[key] !== undefined) {
                element.title = dictionary[key];
            }
        });

        document.querySelectorAll("[data-language-selector]").forEach(select => {
            select.value = language;
        });
    }

    document.addEventListener("DOMContentLoaded", applyTranslations);

    return {
        getLanguage,
        setLanguage,
        applyTranslations
    };
})();