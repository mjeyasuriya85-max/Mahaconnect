// NOTIFICATION PANEL

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");
 notificationPanel.style.display = "none";
const closeNotification = document.getElementById("closeNotification");

notificationBtn.addEventListener("click", function () {
    notificationPanel.style.display = "block";
});

closeNotification.addEventListener("click", function () {
    notificationPanel.style.display = "none";
});
const viewUpdatesBtn = document.getElementById("viewUpdatesBtn");

viewUpdatesBtn.addEventListener("click", function () {
    window.location.href = "updates.html";
});
const applicationSearch = document.getElementById("applicationSearch");

applicationSearch.addEventListener("input", function () {
    const searchValue = applicationSearch.value.toLowerCase();

    document.querySelectorAll(".application-card").forEach(function (card) {
        card.style.display = card.innerText.toLowerCase().includes(searchValue)
            ? "block"
            : "none";
    });
});