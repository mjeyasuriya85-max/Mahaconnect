
const STORAGE_KEY = "mahaConnectNotifications";

const sampleNotifications = [
  {
    id: 1,
    type: "application",
    icon: "📄",
    title: "Application received",
    message: "Your scholarship application has been received successfully. You can check its status from your dashboard.",
    time: "Today",
    read: false
  },
  {
    id: 2,
    type: "service",
    icon: "🔔",
    title: "Welcome to MahaConnect",
    message: "Welcome! Discover public services and manage your service updates in one convenient place.",
    time: "Today",
    read: false
  },
  {
    id: 3,
    type: "document",
    icon: "📁",
    title: "Document wallet reminder",
    message: "Keep your required documents ready before starting a service application. Upload real identity documents only through trusted official services.",
    time: "Yesterday",
    read: true
  },
  {
    id: 4,
    type: "scheme",
    icon: "🌱",
    title: "Explore available schemes",
    message: "Visit the services section to explore schemes and services that may match your needs.",
    time: "2 days ago",
    read: true
  }
];

let notifications = loadNotifications();
let currentFilter = "all";

const list = document.getElementById("notificationList");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");
const unreadCount = document.getElementById("unreadCount");

function loadNotifications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? [...sampleNotifications] : JSON.parse(saved);
  } catch (error) {
    console.error("Could not load notifications:", error);
    return [...sampleNotifications];
  }
}

function saveNotifications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function renderNotifications() {
  totalCount.textContent = notifications.length;
  unreadCount.textContent = notifications.filter(item => !item.read).length;

  const filtered = notifications.filter(item => {
    if (currentFilter === "unread") return !item.read;
    if (currentFilter === "read") return item.read;
    return true;
  });

  list.replaceChildren();
  emptyState.hidden = filtered.length !== 0;

  filtered.forEach(item => {
    const article = document.createElement("article");
    article.className = `notification-item ${item.read ? "" : "unread"}`;

    const icon = document.createElement("div");
    icon.className = "notice-icon";
    icon.textContent = item.icon || "🔔";
    icon.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "notice-content";

    const titleRow = document.createElement("div");
    titleRow.className = "notice-title-row";

    const title = document.createElement("span");
    title.className = "notice-title";
    title.textContent = item.title;

    titleRow.appendChild(title);

    if (!item.read) {
      const dot = document.createElement("span");
      dot.className = "unread-dot";
      dot.setAttribute("aria-label", "Unread");
      titleRow.appendChild(dot);
    }

    const message = document.createElement("p");
    message.className = "notice-message";
    message.textContent = item.message;

    const meta = document.createElement("div");
    meta.className = "notice-meta";
    meta.textContent = item.time;

    content.append(titleRow, message, meta);

    const actions = document.createElement("div");
    actions.className = "notice-actions";

    if (!item.read) {
      const readButton = document.createElement("button");
      readButton.className = "action-btn";
      readButton.textContent = "Mark as read";
      readButton.addEventListener("click", () => {
        updateReadStatus(item.id, true);
      });
      actions.appendChild(readButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "action-btn delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteNotification(item.id);
    });

    actions.appendChild(deleteButton);
    article.append(icon, content, actions);
    list.appendChild(article);
  });
}

function updateReadStatus(id, read) {
  notifications = notifications.map(item =>
    item.id === id ? { ...item, read } : item
  );
  saveNotifications();
  renderNotifications();
}

function deleteNotification(id) {
  notifications = notifications.filter(item => item.id !== id);
  saveNotifications();
  renderNotifications();
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(filterButton => {
      const active = filterButton === button;
      filterButton.classList.toggle("active", active);
      filterButton.setAttribute("aria-pressed", String(active));
    });

    renderNotifications();
  });
});

document.getElementById("markAllBtn").addEventListener("click", () => {
  notifications = notifications.map(item => ({ ...item, read: true }));
  saveNotifications();
  renderNotifications();
});

document.getElementById("clearReadBtn").addEventListener("click", () => {
  notifications = notifications.filter(item => !item.read);
  saveNotifications();
  renderNotifications();
});

renderNotifications();
