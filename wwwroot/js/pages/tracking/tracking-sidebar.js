// wwwroot/js/pages/tracking/tracking-sidebar.js
import { escapeHtml } from "../devices/devices-formatters.js";
import {
  getFilteredTrackingDevices,
  getSelectedMobileId,
  getTrackingDevices,
  isTrackingLoaded,
} from "./tracking-state.js";

// Cập nhật tổng quan thiết bị
export function renderTrackingSummary() {
  const devices = getTrackingDevices();

  const moving = devices.filter((device) => device.status === "moving").length;

  const stopped = devices.filter(
    (device) => device.status === "stopped",
  ).length;

  const stale = devices.filter((device) => device.staleFix === true).length;

  setText("device-count", devices.length);
  setText("tracking-moving-count", moving);
  setText("tracking-stopped-count", stopped);
  setText("tracking-stale-count", stale);
  setText("tracking-map-device-count", `${devices.length} thiết bị`);
}

// Hiển thị danh sách thiết bị
export function renderTrackingDeviceList() {
  const deviceList = document.getElementById("device-list");

  if (!deviceList) return;

  const devices = getFilteredTrackingDevices();

  setText("device-visible-count", devices.length);

  if (!devices.length) {
    deviceList.innerHTML = `
      <li class="tracking-device-list__empty">
        ${getEmptyMessage()}
      </li>
    `;

    return;
  }

  deviceList.innerHTML = devices.map(renderTrackingDeviceCard).join("");
}

function getEmptyMessage() {
  const devices = getTrackingDevices();

  if (!isTrackingLoaded()) {
    return "Đang tải thiết bị...";
  }

  if (!devices.length) {
    return "Chưa có dữ liệu vị trí thiết bị.";
  }

  return "Không tìm thấy thiết bị phù hợp.";
}

// Hiển thị card thiết bị
function renderTrackingDeviceCard(device) {
  const selectedMobileId = getSelectedMobileId();

  const activeClass =
    device.mobileId === selectedMobileId ? " tracking-device-card--active" : "";

  const alertClass = device.alertType === "distress"
    ? " tracking-device-card--distress"
    : device.alertType === "door"
      ? " tracking-device-card--door"
      : device.staleFix === true ? " tracking-device-card--stale" : "";

  const statusClass =
    device.alertType === "distress" ? " tracking-device-card__status--alert"
      : device.alertType === "door" ? " tracking-device-card__status--door"
        : device.status === "moving" ? " tracking-device-card__status--moving" : "";

  return `
    <li>
      <button
        class="tracking-device-card${activeClass}${alertClass}"
        type="button"
        data-mobile-id="${escapeHtml(device.mobileId)}">

        <div class="tracking-device-card__header">
          <div class="tracking-device-card__identity">
            <span
              class="tracking-status-dot tracking-status-dot--${device.markerState}">
            </span>

            <strong>${escapeHtml(device.mobileId)}</strong>
          </div>

          <svg
            class="tracking-device-card__arrow"
            viewBox="0 0 24 24"
            aria-hidden="true">
            <path d="M9 6L15 12L9 18"></path>
          </svg>
        </div>

        <div class="tracking-device-card__status${statusClass}">
          ${escapeHtml(device.statusText)}
          ${device.alertType === "distress" ? " · ĐANG BÁO NGUY" : device.alertType === "door" ? " · Cửa mở" : ""}
          ${device.staleFix === true ? " · Vị trí cũ" : ""}
        </div>

        <div class="tracking-device-card__meta">
          <span>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7V12L15 14"></path>
            </svg>

            ${escapeHtml(getTimeFromDateText(device.updatedAt))}
          </span>

          <span>${escapeHtml(device.speedKph)} km/h</span>
        </div>

        <div class="tracking-device-card__location">
          ${escapeHtml(device.address)}
        </div>

        <div class="tracking-device-card__updated">
          ${escapeHtml(device.updatedText)}
        </div>
      </button>
    </li>
  `;
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
