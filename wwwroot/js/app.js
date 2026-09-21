import { renderTopbar } from "./topbar.js";
import { initializeNotifications } from "./notifications.js";
import { renderTrackingPage, updateTrackingDevices, openTrackingDevicePanel, setTrackingConnectionStatus } from "./pages/tracking/tracking.js";
import { renderDevicesPage, initializeDevicesPage } from "./pages/devices/devices.js";
import {
  renderHistoryPage,
  initializeHistoryPage,
} from "./pages/history/history.js";
import { getDevices } from "./api.js";
import { renderJourneyPage, initializeJourneyPage, destroyJourneyPage } from "./pages/journey/journey.js";
import {
  initializeMap,
  destroyMap,
  renderDevices,
  focusDevice,
  fitAllDevices,
  resizeMap,
} from "./pages/tracking/tracking-map.js";



let currentPage = null;

let trackingInterval = null;
let trackingSession = 0;
let trackingRequest = null;
let pendingNotificationDevice = null;

renderTopbar();

const account = document.querySelector(".topbar__account");
const profileButton = account.querySelector(".topbar__profile");
const accountMenu = account.querySelector(".topbar__account-menu");

function closeAccountMenu() {
  accountMenu.hidden = true;
  profileButton.setAttribute("aria-expanded", "false");
}

profileButton.addEventListener("click", () => {
  const shouldOpen = accountMenu.hidden;
  accountMenu.hidden = !shouldOpen;
  profileButton.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) account.querySelector(".topbar__logout").focus();
});

document.addEventListener("click", (event) => {
  if (!account.contains(event.target)) closeAccountMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !accountMenu.hidden) {
    closeAccountMenu();
    profileButton.focus();
  }
});

fetch("/api/auth/me").then(async (response) => {
  if (!response.ok) return;
  const user = await response.json();
  document.querySelector(".topbar__profile-name").textContent = user.username || "Tài khoản";
  document.querySelector(".topbar__account-username").textContent = user.username || "Tài khoản";
  document.querySelector(".topbar__avatar").textContent = (user.username || "T").charAt(0).toUpperCase();
  initializeNotifications(user.username || "account", (mobileId) => {
    pendingNotificationDevice = mobileId;
    if (currentPage !== "tracking") navigateTo("tracking");
    else if (!trackingRequest) loadDevices();
  });
}).catch(() => {});

account.querySelector(".topbar__logout").addEventListener("click", async () => {
  const logoutButton = account.querySelector(".topbar__logout");
  logoutButton.disabled = true;
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) window.location.replace("/login.html");
    else logoutButton.disabled = false;
  } catch {
    logoutButton.disabled = false;
  }
});

const navigationItems = document.querySelectorAll(".topbar__nav-item");
const pages = new Set(["tracking", "devices", "history", "journey"]);

function pageFromPath() {
  const page = window.location.pathname.slice(1).replace(/\/$/, "");
  return pages.has(page) ? page : "tracking";
}

function navigateTo(page, options = {}) {
  if (!pages.has(page)) return;
  if (window.location.pathname !== `/${page}`) {
    window.history.pushState(null, "", `/${page}`);
  }
  showPage(page, options);
}

/* PAGE */

function showPage(page, options = {}) {
  stopTracking();
  destroyJourneyPage();

  currentPage = page;

  switch (page) {
    case "devices":
      renderDevicesPage();
      initializeDevicesPage();
      break;

    case "history":
      renderHistoryPage();
      initializeHistoryPage(options);

      break;

    case "journey":
      renderJourneyPage();
      initializeJourneyPage(options);
      break;

    case "tracking":
    default:
      renderTrackingPage();

      startTracking();

      break;
  }

  for (const item of navigationItems) {
    item.classList.toggle(
      "topbar__nav-item--active",
      item.dataset.page === page,
    );
  }
}

document.addEventListener("device:show-history", (event) => {
  navigateTo("history", { mobileId: event.detail.mobileId });
});

for (const item of navigationItems) {
  item.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateTo(item.dataset.page);
  });
}

window.addEventListener("popstate", () => showPage(pageFromPath()));

/* TRACKING */

function startTracking() {
  try {
    initializeMap();
  } catch (error) {
    setTrackingConnectionStatus(error.message, true);
    return;
  }
  loadDevices();
  trackingInterval = setInterval(() => {
    if (document.getElementById("auto-refresh")?.checked) loadDevices();
  }, 15000);
  document.getElementById("auto-refresh")?.addEventListener("change", (event) => {
    if (event.target.checked) loadDevices();
    else setTrackingConnectionStatus("Đã tạm dừng tự động cập nhật");
  });
}

function stopTracking() {
  trackingSession++;
  clearInterval(trackingInterval);
  trackingInterval = null;
  trackingRequest?.abort();
  trackingRequest = null;
  destroyMap();
}

async function loadDevices() {
  if (currentPage !== "tracking" || trackingRequest) return;
  const session = trackingSession;
  const request = new AbortController();
  trackingRequest = request;
  const timeout = setTimeout(() => request.abort(), 12000);
  try {
    const devices = await getDevices({ signal: request.signal });
    if (currentPage !== "tracking" || session !== trackingSession) return;
    if (!Array.isArray(devices)) throw new Error("Dữ liệu thiết bị không hợp lệ");
    updateTrackingDevices(devices);
    renderDevices(devices);
    if (pendingNotificationDevice) {
      openTrackingDevicePanel(pendingNotificationDevice);
      focusDevice(pendingNotificationDevice);
      pendingNotificationDevice = null;
    }
    setTrackingConnectionStatus(document.getElementById("auto-refresh")?.checked
      ? `Đã cập nhật: ${new Date().toLocaleTimeString("vi-VN")}`
      : "Đã tạm dừng tự động cập nhật");
  } catch (error) {
    if (session !== trackingSession || currentPage !== "tracking") return;
    setTrackingConnectionStatus(error.name === "AbortError"
      ? "Tải dữ liệu quá thời gian. Sẽ thử lại ở lần cập nhật tiếp theo."
      : `Không tải được dữ liệu: ${error.message}`, true);
  } finally {
    clearTimeout(timeout);
    if (trackingRequest === request) trackingRequest = null;
  }
}

window.addEventListener("tracking:marker-selected", (event) => {
  if (currentPage === "tracking") openTrackingDevicePanel(event.detail.mobileId);
});
for (const eventName of ["tracking:device-selected", "tracking:focus-device"]) {
  window.addEventListener(eventName, (event) => {
    if (currentPage === "tracking") focusDevice(event.detail.mobileId);
  });
}
window.addEventListener("tracking:fit-all", () => {
  if (currentPage === "tracking") fitAllDevices();
});
window.addEventListener("tracking:map-resize", () => {
  if (currentPage === "tracking") resizeMap();
});

/* START */

if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
  window.history.replaceState(null, "", "/tracking");
}
showPage(pageFromPath());
