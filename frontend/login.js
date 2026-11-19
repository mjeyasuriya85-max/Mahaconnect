
"use strict";

const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#loginForm");
    const emailInput = document.querySelector(
        '#email, #emailAddress, input[type="email"]'
    );
    const phoneInput = document.querySelector(
        '#phone, #mobile, #mobileNumber, input[type="tel"]'
    );
    const passwordInput = document.querySelector(
        '#password, input[name="password"], input[type="password"]'
    );
    const sendOtpButton = document.querySelector(
        "#sendOtpBtn, #sendOTP, #sendOtp, button[type='submit']"
    );
    const messageElement = document.querySelector(
        "#message, #errorMessage, #statusMessage, .error-message"
    );

    let otpRequested = false;

    function showMessage(message, isError = true) {
        let element = messageElement;

        if (!element) {
            element = document.createElement("p");
            element.id = "loginStatus";
            element.setAttribute("role", "status");

            if (sendOtpButton?.parentElement) {
                sendOtpButton.parentElement.insertAdjacentElement(
                    "beforebegin",
                    element
                );
            } else {
                document.body.appendChild(element);
            }
        }

        element.textContent = message;
        element.style.color = isError ? "#b91c1c" : "#15803d";
    }

    function getPhoneNumber() {
        let phone = phoneInput?.value.trim() || "";
        phone = phone.replace(/[\s()-]/g, "");

        if (/^\d{10}$/.test(phone)) {
            phone = "+91" + phone;
        }

        return phone;
    }

    async function sendOtp(event) {
        if (event) event.preventDefault();

        const email = emailInput?.value.trim() || "";
        const password = passwordInput?.value || "";
        const phone = getPhoneNumber();

        if (!email || !password || !phone) {
            showMessage(
                "Please enter your email, mobile number and password."
            );
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMessage("Please enter a valid email address.");
            return;
        }

        if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
            showMessage(
                "Enter a valid mobile number with country code, e.g. +919876543210."
            );
            return;
        }

        if (sendOtpButton) {
            sendOtpButton.disabled = true;
            sendOtpButton.textContent = "Sending OTP...";
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/send-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        phone
                    })
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.message ||
                    `Request failed (${response.status}).`
                );
            }

            otpRequested = true;
            showMessage(
                result.message || "OTP request sent. Check your SMS.",
                false
            );

            showOtpInput();
        } catch (error) {
            console.error("Send OTP error:", error);

            showMessage(
                error.message ||
                "Unable to connect to the server. Check that the backend is running."
            );
        } finally {
            if (sendOtpButton) {
                sendOtpButton.disabled = false;
                sendOtpButton.textContent = "Send OTP →";
            }
        }
    }

    function showOtpInput() {
        let otpInput = document.querySelector("#otp");
        let verifyButton = document.querySelector("#verifyOtpBtn");

        if (!otpInput) {
            const container = document.createElement("div");
            container.id = "otpSection";
            container.style.marginTop = "16px";

            const label = document.createElement("label");
            label.htmlFor = "otp";
            label.textContent = "Enter 6-digit OTP";

            otpInput = document.createElement("input");
            otpInput.id = "otp";
            otpInput.name = "otp";
            otpInput.type = "text";
            otpInput.inputMode = "numeric";
            otpInput.autocomplete = "one-time-code";
            otpInput.maxLength = 6;
            otpInput.placeholder = "Enter OTP";
            otpInput.required = true;
            otpInput.style.display = "block";
            otpInput.style.width = "100%";
            otpInput.style.padding = "12px";
            otpInput.style.marginTop = "8px";
            otpInput.style.boxSizing = "border-box";

            verifyButton = document.createElement("button");
            verifyButton.id = "verifyOtpBtn";
            verifyButton.type = "button";
            verifyButton.textContent = "Verify OTP";
            verifyButton.style.marginTop = "12px";

            container.append(label, otpInput, verifyButton);

            if (sendOtpButton?.parentElement) {
                sendOtpButton.insertAdjacentElement(
                    "afterend",
                    container
                );
            } else {
                document.body.appendChild(container);
            }

            verifyButton.addEventListener("click", verifyOtp);
        }

        otpInput.focus();
    }

    async function verifyOtp() {
        if (!otpRequested) {
            showMessage("Please request an OTP first.");
            return;
        }

        const email = emailInput?.value.trim() || "";
        const phone = getPhoneNumber();
        const otp = document.querySelector("#otp")?.value.trim() || "";
        const verifyButton = document.querySelector("#verifyOtpBtn");

        if (!/^\d{6}$/.test(otp)) {
            showMessage("Enter the 6-digit OTP received on your phone.");
            return;
        }

        if (verifyButton) {
            verifyButton.disabled = true;
            verifyButton.textContent = "Verifying...";
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        phone,
                        otp
                    })
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.message ||
                    `Verification failed (${response.status}).`
                );
            }

            showMessage(
                result.message || "OTP verified successfully.",
                false
            );

            // OTP verification does not automatically create
            // or authenticate a citizen account.
            // Connect your existing login/authentication flow here.
        } catch (error) {
            console.error("Verify OTP error:", error);
            showMessage(error.message || "OTP verification failed.");
        } finally {
            if (verifyButton) {
                verifyButton.disabled = false;
                verifyButton.textContent = "Verify OTP";
            }
        }
    }

    if (form) {
        form.addEventListener("submit", sendOtp);
    } else if (sendOtpButton) {
        sendOtpButton.addEventListener("click", sendOtp);
    } else {
        showMessage(
            "Login button not found. Check the button and form IDs in login.html."
        );
    }
});
