import { renderTopbar } from "./topbar.js";
import { renderTrackingPage } from "./pages/tracking.js";
import { renderDevicesPage } from "./pages/devices.js";
import { renderHistoryPage } from "./pages/history.js";
import { getDevices } from "./api.js";
import {
  initializeMap,
  destroyMap,
  renderDevices,
  focusDevice,
} from "./map.js";

import { formatDate } from "./popup.js";

let currentPage = null;

let trackingInterval = null;

renderTopbar();

const navigationItems = document.querySelectorAll(".topbar__nav-item");

/* PAGE */

function showPage(page) {
  stopTracking();

  currentPage = page;

  switch (page) {
    case "devices":
      renderDevicesPage();

      break;

    case "history":
      renderHistoryPage();

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
    const statusElement = document.getElementById("connection-status");

    if (statusElement) {
      statusElement.textContent = error.message;

      statusElement.classList.add("error");
    }

    return;
  }

  loadDevices();

  trackingInterval = setInterval(loadDevices, 15000);
}

function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);

    trackingInterval = null;
  }

  destroyMap();
}

/* DEVICE LIST */

function renderDeviceList(devices) {
  const deviceListElement = document.getElementById("device-list");

  if (!deviceListElement) {
    return;
  }

  deviceListElement.replaceChildren();

  for (const device of devices) {
    const button = document.createElement("button");

    button.innerHTML = `
      <strong>
        ${device.mobileId}
      </strong>

      <small>
        ${formatDate(device.updatedAt)}
      </small>
    `;

    button.addEventListener("click", () => {
      focusDevice(device.mobileId);
    });

    const item = document.createElement("li");

    item.append(button);

    deviceListElement.append(item);
  }
}

/* LOAD DEVICES */

async function loadDevices() {
  if (currentPage !== "tracking") {
    return;
  }

  const statusElement = document.getElementById("connection-status");

  const countElement = document.getElementById("device-count");

  try {
    const devices = await getDevices();

    if (currentPage !== "tracking") {
      return;
    }

    renderDevices(devices);

    renderDeviceList(devices);

    if (countElement) {
      countElement.textContent = devices.length;
    }

    if (statusElement) {
      statusElement.textContent = `Đã cập nhật: ${new Date().toLocaleTimeString(
        "vi-VN",
      )}`;

      statusElement.classList.remove("error");
    }
  } catch (error) {
    if (statusElement) {
      statusElement.textContent = `Không tải được dữ liệu: ${error.message}`;

      statusElement.classList.add("error");
    }
  }
}

/* START */

showPage("tracking");
