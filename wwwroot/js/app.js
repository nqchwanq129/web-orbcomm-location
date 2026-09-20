import { renderTopbar } from "./topbar.js";
import { renderTrackingPage, updateTrackingDevices, openTrackingDevicePanel, setTrackingConnectionStatus } from "./pages/tracking.js?v=2";
import { renderDevicesPage, initializeDevicesPage } from "./pages/devices/devices.js?v=3";
import {
  renderHistoryPage,
  initializeHistoryPage,
} from "./pages/history/history.js?v=2";
import { getDevices } from "./api.js?v=3";
import {
  initializeMap,
  destroyMap,
  renderDevices,
  focusDevice,
  fitAllDevices,
  resizeMap,
} from "./map.js?v=2";



let currentPage = null;

let trackingInterval = null;
let trackingSession = 0;
let trackingRequest = null;

renderTopbar();

const navigationItems = document.querySelectorAll(".topbar__nav-item");

/* PAGE */

function showPage(page, options = {}) {
  stopTracking();

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
  showPage("history", { mobileId: event.detail.mobileId });
});

for (const item of navigationItems) {
  item.addEventListener("click", () => {
    showPage(item.dataset.page);
  });
}

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

showPage("tracking");
