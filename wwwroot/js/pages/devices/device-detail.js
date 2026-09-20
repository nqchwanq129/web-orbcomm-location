// wwwroot/js/pages/devices/device-detail.js

import { loadDeviceAddress } from "./devices-location.js";
import {
  escapeHtml,
  formatBattery,
  formatCoordinate,
  formatHeading,
  formatSpeed,
  formatUpdateTime,
  getMotionClass,
  getMotionText,
  localDateFormatter,
  parseReportTime,
} from "./devices-formatters.js?v=2";

let deviceDetailMap = null;

// Hiển thị chi tiết thiết bị
export function renderDeviceDetailPage(device, onBack) {
  const pageContent = document.getElementById("page-content");
  const reportTime = parseReportTime(device.reportTimestampUtc);
  const updateText = reportTime
    ? formatUpdateTime(reportTime)
    : "Chưa có dữ liệu";

  pageContent.innerHTML = `
    <section class="device-detail">
      <button class="device-detail__back" id="device-detail-back" type="button">
        ← Danh sách thiết bị
      </button>

      <div class="device-detail__header">
        <div class="device-detail__heading">
          <span class="device-detail__eyebrow">Chi tiết thiết bị</span>

          <div class="device-detail__title-row">
            <h1 class="device-detail__title">
              ${escapeHtml(device.mobileId ?? "Không xác định")}
            </h1>

            <span class="device-detail__status ${getMotionClass(device.motionState)}">
              <span class="device-detail__status-dot"></span>
              ${getMotionText(device.motionState)}
            </span>
          </div>

          <p class="device-detail__updated">
            Cập nhật ${escapeHtml(updateText)}
          </p>
        </div>

        <div class="device-detail__actions">
          <button
            id="device-detail-locate"
            class="device-detail__action"
            type="button"
          >
            Định vị
          </button>

          <button
            id="device-detail-history"
            class="device-detail__action device-detail__action--primary"
            type="button"
          >
            Xem lịch sử
          </button>
        </div>
      </div>

      <div class="device-detail__map" id="device-detail-map"></div>

      <div class="device-detail__stats">
        ${renderDeviceStat("Tốc độ", formatSpeed(device.speedKmh))}
        ${renderDeviceStat("Hướng", formatHeading(device.headingDeg))}
        ${renderDeviceStat("Pin", formatBattery(device.batteryVoltage))}
        ${renderDeviceStat("Trạng thái", getMotionText(device.motionState))}
      </div>

      <div class="device-detail__grid">
        ${renderLocationCard(device)}

        ${renderRecentHistory(device, reportTime)}

        ${renderInformationCard(device, reportTime)}
      </div>
    </section>
  `;

  initializeDeviceDetailEvents(device, onBack);
  loadDeviceAddress("device-detail-address", device.latitude, device.longitude);
  loadDeviceAddress(
    "device-detail-history-address",
    device.latitude,
    device.longitude,
  );
  renderDeviceDetailMap(device);
}

// Hiển thị thông tin vị trí
function renderLocationCard(device) {
  return `
    <div class="device-detail__card">
      <span class="device-detail__card-title">Vị trí hiện tại</span>

      <p id="device-detail-address" class="device-detail__address">
        Đang xác định vị trí...
      </p>

      <div class="device-detail__location-row">
        <span>Tọa độ</span>
        <strong>
          ${formatCoordinate(device.latitude)},
          ${formatCoordinate(device.longitude)}
        </strong>
      </div>
    </div>
  `;
}

// Hiển thị lịch sử gần đây
function renderRecentHistory(device, reportTime) {
  return `
    <div class="device-detail__history" id="device-detail-history-section">
      <div class="device-detail__history-header">
        <div>
          <span class="device-detail__card-title">Lịch sử gần đây</span>
          <p>Hoạt động mới nhất của thiết bị.</p>
        </div>

        <button
          class="device-detail__history-all"
          id="device-detail-history-all"
          type="button"
        >
          Xem toàn bộ
        </button>
      </div>

      <div class="device-detail__history-table-wrapper">
        <table class="device-detail__history-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Tốc độ</th>
              <th>Vị trí</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                ${
                  reportTime
                    ? escapeHtml(localDateFormatter.format(reportTime))
                    : "—"
                }
              </td>

              <td>
                <span class="device-detail__history-status ${getMotionClass(device.motionState)}">
                  <span></span>
                  ${escapeHtml(getMotionText(device.motionState))}
                </span>
              </td>

              <td>${escapeHtml(formatSpeed(device.speedKmh))}</td>

              <td>
                <span id="device-detail-history-address">
                  Đang xác định vị trí...
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Hiển thị thông tin thiết bị
function renderInformationCard(device, reportTime) {
  return `
    <div class="device-detail__card">
      <span class="device-detail__card-title">Thông tin thiết bị</span>

      <div class="device-detail__info">
        <span>Mobile ID</span>
        <strong>${escapeHtml(device.mobileId ?? "—")}</strong>
      </div>

      <div class="device-detail__info">
        <span>Thời gian báo cáo</span>
        <strong>
          ${reportTime ? escapeHtml(localDateFormatter.format(reportTime)) : "—"}
        </strong>
      </div>
    </div>
  `;
}

// Khởi tạo sự kiện trang chi tiết
function initializeDeviceDetailEvents(device, onBack) {
  document
    .getElementById("device-detail-history-all")
    .addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("device:show-history", {
        detail: { mobileId: device.mobileId },
      }));
    });

  document
    .getElementById("device-detail-back")
    .addEventListener("click", onBack);

  document
    .getElementById("device-detail-history")
    .addEventListener("click", () => {
      document.getElementById("device-detail-history-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

  document
    .getElementById("device-detail-locate")
    .addEventListener("click", () => locateDevice(device));
}

// Định vị thiết bị trên bản đồ
function locateDevice(device) {
  const latitude = Number(device.latitude);
  const longitude = Number(device.longitude);

  if (!deviceDetailMap) return;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  deviceDetailMap.flyTo({
    center: [longitude, latitude],
    zoom: 16,
    duration: 1000,
  });
}

// Hiển thị bản đồ chi tiết thiết bị
function renderDeviceDetailMap(device) {
  const latitude = Number(device.latitude);
  const longitude = Number(device.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  if (deviceDetailMap) {
    deviceDetailMap.remove();
    deviceDetailMap = null;
  }

  deviceDetailMap = new maplibregl.Map({
    container: "device-detail-map",
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm",
        },
      ],
    },
    center: [longitude, latitude],
    zoom: 15,
  });

  deviceDetailMap.addControl(new maplibregl.NavigationControl(), "top-right");

  const markerElement = document.createElement("div");

  markerElement.className = "device-detail__marker";
  markerElement.innerHTML = `
    <span class="device-detail__marker-dot"></span>
  `;

  new maplibregl.Marker({
    element: markerElement,
    anchor: "center",
  })
    .setLngLat([longitude, latitude])
    .addTo(deviceDetailMap);
}

// Hiển thị ô thống kê
function renderDeviceStat(label, value) {
  return `
    <div class="device-detail__stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}
