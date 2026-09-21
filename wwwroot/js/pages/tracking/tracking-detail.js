// wwwroot/js/pages/tracking/tracking-detail.js
import {
  getTrackingDevice,
  setSelectedMobileId,
  toNumberOrNull,
} from "./tracking-state.js";
import { renderTrackingDeviceList } from "./tracking-sidebar.js";

// Mở panel chi tiết
export function openTrackingDevicePanel(mobileId) {
  const device = getTrackingDevice(mobileId);
  const trackingPage = document.querySelector(".tracking-page");

  if (!device || !trackingPage) return;

  setSelectedMobileId(mobileId);

  renderTrackingDeviceList();
  renderTrackingDeviceDetail(device);

  trackingPage.classList.add("tracking-page--detail-open");

  const panel = document.getElementById("tracking-device-panel");

  if (panel) {
    panel.inert = false;
  }

  window.dispatchEvent(
    new CustomEvent("tracking:device-selected", {
      detail: {
        mobileId: device.mobileId,
        latitude: device.latitude,
        longitude: device.longitude,
      },
    }),
  );

  notifyTrackingMapResize();
}

// Đóng panel chi tiết
export function closeTrackingDevicePanel() {
  const trackingPage = document.querySelector(".tracking-page");

  if (!trackingPage) return;

  setSelectedMobileId(null);

  trackingPage.classList.remove("tracking-page--detail-open");

  const panel = document.getElementById("tracking-device-panel");

  if (panel) {
    panel.inert = true;
  }

  renderTrackingDeviceList();

  window.dispatchEvent(new CustomEvent("tracking:device-unselected"));

  notifyTrackingMapResize();
}

// Hiển thị chi tiết thiết bị
export function renderTrackingDeviceDetail(device) {
  setText("tracking-detail-mobile-id", device.mobileId);
  setText("tracking-detail-state-text", device.statusText);
  setText("tracking-detail-updated", device.updatedText);
  setText("tracking-detail-address", device.address);

  setText("tracking-detail-latitude", device.latitude?.toFixed(6) ?? "—");

  setText("tracking-detail-longitude", device.longitude?.toFixed(6) ?? "—");

  setText("tracking-detail-speed", device.speedKph);
  setText("tracking-detail-heading", device.headingText);
  setText("tracking-detail-motion", device.motionText);

  setText("tracking-detail-battery", device.batteryV?.toFixed(2) ?? "—");

  setText("tracking-message-mobile-id", device.mobileId);
  setText("tracking-message-log-id", device.logId);
  setText("tracking-message-type", device.messageType);
  setText("tracking-message-time", device.messageTime);
  setText("tracking-report-time", device.reportTime);
  setText("tracking-message-updated", device.updatedAt);
  setText("tracking-message-badge", device.messageType);

  setText("tracking-detail-footer-time", getTimeFromDateText(device.updatedAt));

  setText("tracking-report-source", device.reportSourceName || "—");

  const temperature = toNumberOrNull(device.internalTemperatureC);

  setText(
    "tracking-temperature",
    temperature === null ? "—" : `${temperature} °C`,
  );

  updateTrackingDeviceState(device.status);
  renderTrackingAlert(device);

  const locateButton = document.getElementById("tracking-detail-locate");

  const copyButton = document.getElementById("tracking-copy-coordinate");

  if (locateButton) {
    locateButton.disabled = !device.hasPosition;
  }

  if (copyButton) {
    copyButton.disabled = !device.hasPosition;
  }
}

// Cập nhật trạng thái
function updateTrackingDeviceState(status) {
  const state = document.getElementById("tracking-detail-state");

  const dot = document.getElementById("tracking-detail-state-dot");

  if (!state || !dot) return;

  state.classList.remove(
    "tracking-device-state--moving",
    "tracking-device-state--stopped",
    "tracking-device-state--unknown",
  );

  dot.classList.remove(
    "tracking-status-dot--moving",
    "tracking-status-dot--stopped",
    "tracking-status-dot--unknown",
  );

  state.classList.add(`tracking-device-state--${status}`);

  dot.classList.add(`tracking-status-dot--${status}`);
}

// Hiển thị trạng thái GPS
function renderTrackingAlert(device) {
  const badge = document.getElementById("tracking-alert-badge");

  if (!badge) return;

  if (device.staleFix === true) {
    badge.textContent = "GPS cũ";

    setText(
      "tracking-alert-content",
      "Bản tin sử dụng vị trí GPS cũ, có thể không phản ánh vị trí hiện tại.",
    );
  } else if (device.staleFix === false) {
    badge.textContent = "GPS mới";

    setText("tracking-alert-content", "Bản tin sử dụng vị trí GPS mới.");
  } else {
    badge.textContent = "Không xác định";

    setText(
      "tracking-alert-content",
      "Chưa có thông tin về độ mới của vị trí GPS.",
    );
  }

  badge.classList.toggle(
    "tracking-alert-badge--normal",
    device.staleFix === false,
  );
  badge.classList.toggle("tracking-alert-badge--stale", device.staleFix === true);
}

function getTimeFromDateText(value) {
  if (!value) return "--";

  const match = value.match(/\b\d{2}:\d{2}:\d{2}\b/);

  return match?.[0] ?? value;
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = value ?? "--";
}

function notifyTrackingMapResize() {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent("tracking:map-resize"));
  }, 280);
}
