// wwwroot/js/pages/tracking/tracking.js
import {
  getSelectedMobileId,
  getTrackingDevice,
  isTrackingLoaded,
  resetTrackingState,
  setTrackingDevices,
} from "./tracking-state.js";
import { renderTrackingView } from "./tracking-view.js";
import {
  renderTrackingDeviceList,
  renderTrackingSummary,
} from "./tracking-sidebar.js";
import {
  closeTrackingDevicePanel,
  renderTrackingDeviceDetail,
} from "./tracking-detail.js";
import { bindTrackingUiEvents } from "./tracking-events.js";

export { openTrackingDevicePanel } from "./tracking-detail.js";

// Hiển thị trang tracking
export function renderTrackingPage() {
  resetTrackingState();

  const rendered = renderTrackingView();

  if (!rendered) return;

  renderTrackingSummary();
  renderTrackingDeviceList();
  bindTrackingUiEvents();
  notifyTrackingMapResize();
}

// Cập nhật dữ liệu thiết bị
export function updateTrackingDevices(devices) {
  setTrackingDevices(devices);

  renderTrackingSummary();
  renderTrackingDeviceList();

  const selectedMobileId = getSelectedMobileId();

  if (!selectedMobileId) return;

  const selected = getTrackingDevice(selectedMobileId);

  if (selected) {
    renderTrackingDeviceDetail(selected);
    return;
  }

  closeTrackingDevicePanel();
}

// Cập nhật trạng thái kết nối
export function setTrackingConnectionStatus(message, isError = false) {
  setText("connection-status", message);

  setText("tracking-detail-connection-status", message);

  document
    .querySelector(".tracking-map-status")
    ?.classList.toggle("tracking-map-status--error", isError);

  if (!isError) return;

  const deviceList = document.getElementById("device-list");

  if (!deviceList) return;

  if (!isTrackingLoaded()) {
    deviceList.innerHTML = `
      <li class="tracking-device-list__empty">
        Không tải được danh sách thiết bị.
      </li>
    `;
  }
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
