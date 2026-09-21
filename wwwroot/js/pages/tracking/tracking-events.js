// wwwroot/js/pages/tracking/tracking-events.js
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

// Khởi tạo sự kiện tracking
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

// Định vị thiết bị đang chọn
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

// Hiển thị toàn bộ thiết bị
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

// Sao chép tọa độ
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

// Bật tắt toàn màn hình
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

function notifyTrackingMapResize() {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent("tracking:map-resize"));
  }, 280);
}
