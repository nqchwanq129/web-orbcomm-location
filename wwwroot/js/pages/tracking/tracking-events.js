import {
  getSelectedMobileId,
  getTrackingDevice,
  getTrackingDevices,
  setTrackingFilter,
  setTrackingSearchKeyword,
} from "./tracking-state.js";
import {
  closeTrackingDevicePanel,
  openTrackingDevicePanel,
} from "./tracking-detail.js";
import { renderTrackingDeviceList } from "./tracking-sidebar.js";
import { getTrackingCommandPayload, loadTrackingCommandHistory, showMoreTrackingCommandHistory } from "./tracking-commands.js";

export function bindTrackingUiEvents() {
  const deviceList = document.getElementById("device-list");
  const searchInput = document.getElementById("tracking-device-search");
  const filters = document.querySelector(".tracking-sidebar__filters");

  deviceList?.addEventListener("click", handleDeviceListClick);
  searchInput?.addEventListener("input", handleSearch);
  filters?.addEventListener("click", handleFilter);

  document
    .getElementById("tracking-detail-close")
    ?.addEventListener("click", closeTrackingDevicePanel);

  document
    .getElementById("tracking-detail-locate")
    ?.addEventListener("click", focusSelectedTrackingDevice);

  document
    .getElementById("tracking-map-focus-selected")
    ?.addEventListener("click", focusSelectedTrackingDevice);

  document
    .getElementById("tracking-copy-coordinate")
    ?.addEventListener("click", copySelectedDeviceCoordinate);

  document
    .getElementById("fit-all-devices")
    ?.addEventListener("click", requestFitAllTrackingDevices);

  document
    .getElementById("tracking-map-fit-all")
    ?.addEventListener("click", requestFitAllTrackingDevices);

  document
    .getElementById("tracking-map-fullscreen")
    ?.addEventListener("click", toggleTrackingFullscreen);

  document
    .getElementById("tracking-command-submit")
    ?.addEventListener("click", handleTrackingCommandSubmit);

  document
    .getElementById("tracking-command-history-more")
    ?.addEventListener("click", showMoreTrackingCommandHistory);
}

function handleDeviceListClick(event) {
  const card = event.target.closest(".tracking-device-card");

  if (!card) return;

  openTrackingDevicePanel(card.dataset.mobileId);
}

function handleSearch(event) {
  setTrackingSearchKeyword(event.target.value);
  renderTrackingDeviceList();
}

function handleFilter(event) {
  const button = event.target.closest(".tracking-sidebar__filter");

  if (!button) return;

  setTrackingFilter(button.dataset.filter);

  document.querySelectorAll(".tracking-sidebar__filter").forEach((filter) => {
    filter.classList.toggle(
      "tracking-sidebar__filter--active",
      filter === button,
    );
  });

  renderTrackingDeviceList();
}

function focusSelectedTrackingDevice() {
  const device = getTrackingDevice(getSelectedMobileId());

  if (!device?.hasPosition) return;

  window.dispatchEvent(
    new CustomEvent("tracking:focus-device", {
      detail: {
        mobileId: device.mobileId,
        latitude: device.latitude,
        longitude: device.longitude,
      },
    }),
  );
}

function requestFitAllTrackingDevices() {
  const devices = getTrackingDevices();

  window.dispatchEvent(
    new CustomEvent("tracking:fit-all", {
      detail: {
        devices: devices.map((device) => ({
          mobileId: device.mobileId,
          latitude: device.latitude,
          longitude: device.longitude,
        })),
      },
    }),
  );
}

async function copySelectedDeviceCoordinate() {
  const device = getTrackingDevice(getSelectedMobileId());

  if (!device?.hasPosition) return;

  const coordinate =
    `${device.latitude.toFixed(6)}, ` + `${device.longitude.toFixed(6)}`;

  try {
    await navigator.clipboard.writeText(coordinate);
  } catch {
    const textarea = document.createElement("textarea");

    textarea.value = coordinate;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();
    document.execCommand("copy");

    textarea.remove();
  }
}

async function toggleTrackingFullscreen() {
  const mapArea = document.querySelector(".tracking-map-area");

  if (!mapArea) return;

  try {
    if (!document.fullscreenElement) {
      await mapArea.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }

    notifyTrackingMapResize();
  } catch {
    return;
  }
}

async function handleTrackingCommandSubmit() {
  const payload = getTrackingCommandPayload();
  if (!payload) return;
  const button = document.getElementById("tracking-command-submit");
  const result = document.getElementById("tracking-command-result");
  if (!button || button.disabled) return;
  button.disabled = true;
  if (result) {
    result.textContent = "Đang gửi lệnh...";
    result.dataset.state = "pending";
  }

  const body = {
    commandType: payload.command,
    reportValue: payload.command === "requestReport" ? payload.value : null,
    sensorIndex: payload.command === "getSensor" ? payload.value : null,
  };
  try {
    const response = await fetch(`/api/devices/${encodeURIComponent(payload.mobileId)}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data === "string" ? data : data.message || `HTTP ${response.status}`);
    if (result && getSelectedMobileId() === payload.mobileId) {
      result.textContent = `${data.message}${data.commandId ? ` (Command ID: ${data.commandId})` : ""}`;
      result.dataset.state = data.success ? "success" : "error";
    }
    if (getSelectedMobileId() === payload.mobileId)
      loadTrackingCommandHistory().catch((error) => console.error("Không làm mới được lịch sử lệnh:", error));
  } catch (error) {
    if (result && getSelectedMobileId() === payload.mobileId) {
      result.textContent = error.message || "Không gửi được lệnh.";
      result.dataset.state = "error";
    }
  } finally {
    button.disabled = false;
  }
}

function notifyTrackingMapResize() {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent("tracking:map-resize"));
  }, 280);
}
