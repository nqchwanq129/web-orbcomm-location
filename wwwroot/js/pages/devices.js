// wwwroot/js/pages/devices.js

import { getDevices } from "../api.js?v=2";

let devicesData = [];
let filteredDevices = [];
let currentPage = 1;
const pageSize = 12;
const addressCache = new Map();
let updateTimeTimer;
let deviceDetailMap = null;
const localDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});
const relativeTimeFormatter = new Intl.RelativeTimeFormat("vi-VN", {
  numeric: "always",
});

// Hiển thị trang danh sách thiết bị
export function renderDevicesPage() {
  clearTimeout(updateTimeTimer);
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <section class="devices-page">
      <div class="devices-page__header">
        <div>
          <span class="devices-page__eyebrow">Thiết bị</span>
          <h1 class="devices-page__title">Danh sách thiết bị</h1>
          <p class="devices-page__subtitle">
            Danh sách thiết bị và vị trí mới nhất đang được ghi nhận.
          </p>
        </div>
      </div>

      <div class="devices-card">
        <div class="devices-card__header">
          <div>
            <h2>Danh sách thiết bị</h2>
            <p id="devices-total-text">Đang tải dữ liệu...</p>
          </div>
        </div>

        <div class="devices-toolbar">
          <div class="devices-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M20 20L16.65 16.65"></path>
            </svg>
            <input
              id="devices-search"
              type="search"
              placeholder="Tìm theo Mobile ID..."
              autocomplete="off"
            />
          </div>
        </div>

        <div class="devices-table-wrapper">
          <table class="devices-table">
<thead>
  <tr>
    <th>Thiết bị</th>
    <th>Vị trí</th>
    <th class="devices-table__updated-heading">Cập nhật lần cuối</th>
  </tr>
</thead>
            <tbody id="devices-table-body"></tbody>
          </table>
        </div>

        <div class="devices-footer">
          <span id="devices-result-count">0 thiết bị</span>

          <div class="devices-pagination">
            <button id="devices-prev" type="button" aria-label="Trang trước">
              ‹
            </button>

            <span id="devices-page-info">
              1 / 1
            </span>

            <button id="devices-next" type="button" aria-label="Trang sau">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Khởi tạo trang danh sách thiết bị
export async function initializeDevicesPage() {
  const searchInput = document.getElementById("devices-search");
  const previousButton = document.getElementById("devices-prev");
  const nextButton = document.getElementById("devices-next");

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    filterDevices();
  });

  previousButton.addEventListener("click", () => {
    if (currentPage <= 1) return;

    currentPage--;
    renderDevicesTable();
  });

  nextButton.addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) return;

    currentPage++;
    renderDevicesTable();
  });

  const tableBody = document.getElementById("devices-table-body");
  await loadDevices();
  if (!tableBody?.isConnected) return;
  function refreshTimes() {
    if (!tableBody?.isConnected) return;
    tableBody.querySelectorAll("time[data-report-time]").forEach((element) => {
      element.textContent = formatUpdateTime(new Date(element.dateTime));
    });
    updateTimeTimer = setTimeout(refreshTimes, 60000);
  }
  clearTimeout(updateTimeTimer);
  refreshTimes();
}

// Tải dữ liệu thiết bị
async function loadDevices() {
  const tableBody = document.getElementById("devices-table-body");
  const totalText = document.getElementById("devices-total-text");

  renderLoadingRow(tableBody);

  try {
    const data = await getDevices();

    if (!tableBody.isConnected) return;

    devicesData = Array.isArray(data) ? data : [];
    filteredDevices = [...devicesData];
    currentPage = 1;

    totalText.textContent = `${devicesData.length} thiết bị đang được ghi nhận`;

    renderDevicesTable();
  } catch (error) {
    if (!tableBody.isConnected) return;

    console.error("Không tải được danh sách thiết bị:", error);

    devicesData = [];
    filteredDevices = [];
    totalText.textContent = "Không tải được dữ liệu";

    renderEmptyRow(tableBody, `Không tải được dữ liệu: ${error.message}`);
    updatePagination();
  }
}

async function loadDeviceAddress(elementId, latitude, longitude) {
  const element = document.getElementById(elementId);

  if (!element) return;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    element.textContent = "Không xác định được vị trí";
    return;
  }

  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  if (addressCache.has(cacheKey)) {
    element.textContent = addressCache.get(cacheKey);
    return;
  }

  try {
    const address = await reverseGeocode(lat, lng);

    addressCache.set(cacheKey, address);

    if (element.isConnected) {
      element.textContent = address;
    }
  } catch (error) {
    console.error("Không lấy được địa chỉ:", error);

    if (element.isConnected) {
      element.textContent = "Không xác định được địa chỉ";
    }
  }
}

async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude,
    lon: longitude,
    "accept-language": "vi",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Geocoding trả về ${response.status}`);
  }

  const data = await response.json();

  return data.display_name || "Không xác định được địa chỉ";
}

// Lọc thiết bị
function filterDevices() {
  const searchInput = document.getElementById("devices-search");
  const keyword = searchInput.value.trim().toLowerCase();

  filteredDevices = devicesData.filter((device) => {
    return (device.mobileId ?? "").toLowerCase().includes(keyword);
  });

  renderDevicesTable();
}

// Hiển thị bảng thiết bị
function renderDevicesTable() {
  const tableBody = document.getElementById("devices-table-body");

  if (!tableBody) return;

  tableBody.replaceChildren();

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredDevices.slice(startIndex, endIndex);

  if (!pageData.length) {
    renderEmptyRow(tableBody, "Không có thiết bị phù hợp.");
    updatePagination();
    return;
  }

  for (const device of pageData) {
    const row = document.createElement("tr");
    const locationId = `device-location-${device.mobileId}`;

    row.className = "devices-table__row";
    row.addEventListener("click", () => {
      renderDeviceDetailPage(device);
    });

    row.innerHTML = `
    <td>
      <strong class="devices-table__device">
        ${escapeHtml(device.mobileId ?? "—")}
      </strong>
    </td>
    <td>
      <div class="devices-table__location">
        <span id="${locationId}" class="devices-table__address">
          Đang xác định vị trí...
        </span>
      </div>
    </td>
    <td class="devices-table__updated-cell">
  <div class="devices-table__updated-wrapper">
    <span class="devices-table__updated"></span>
    <span class="devices-table__arrow">›</span>
  </div>
</td>
  `;

    const updatedCell = row.querySelector(".devices-table__updated");
    const reportTime = parseReportTime(device.reportTimestampUtc);
    if (reportTime) {
      const time = document.createElement("time");
      time.dataset.reportTime = "";
      time.dateTime = reportTime.toISOString();
      time.textContent = formatUpdateTime(reportTime);
      time.title = localDateFormatter.format(reportTime);
      updatedCell.append(time);
    } else {
      updatedCell.textContent = "Chưa có dữ liệu";
    }

    tableBody.append(row);

    const addressElement = row.querySelector(".devices-table__address");
    addressElement.addEventListener("mouseenter", () => {
      if (addressElement.scrollWidth > addressElement.clientWidth) {
        addressElement.title = addressElement.textContent.trim();
      } else {
        addressElement.removeAttribute("title");
      }
    });
    addressElement.addEventListener("mouseleave", () => {
      addressElement.removeAttribute("title");
    });

    loadDeviceAddress(locationId, device.latitude, device.longitude);
    loadDeviceAddress(
      "device-detail-history-address",
      device.latitude,
      device.longitude,
    );
  }

  updatePagination();
}

// Hiển thị chi tiết thiết bị
function renderDeviceDetailPage(device) {
  clearTimeout(updateTimeTimer);

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
        ${renderDeviceStat("Tốc độ", formatSpeed(device.speedKph))}
        ${renderDeviceStat("Hướng", formatHeading(device.headingDeg))}
        ${renderDeviceStat("Pin", formatBattery(device.batteryMv))}
        ${renderDeviceStat("Trạng thái", getMotionText(device.motionState))}
      </div>

<div class="device-detail__grid">
  <div class="device-detail__card">
    <span class="device-detail__card-title">Vị trí hiện tại</span>

    <p
      id="device-detail-address"
      class="device-detail__address"
    >
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

          <td>
            ${escapeHtml(formatSpeed(device.speedKph))}
          </td>

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

  <div class="device-detail__card">
    <span class="device-detail__card-title">Thông tin thiết bị</span>

    <div class="device-detail__info">
      <span>Mobile ID</span>
      <strong>${escapeHtml(device.mobileId ?? "—")}</strong>
    </div>

    <div class="device-detail__info">
      <span>Loại bản tin</span>
      <strong>${escapeHtml(device.messageType ?? "—")}</strong>
    </div>

    <div class="device-detail__info">
      <span>Thời gian báo cáo</span>
      <strong>
        ${reportTime ? escapeHtml(localDateFormatter.format(reportTime)) : "—"}
      </strong>
    </div>
  </div>
</div>
    </section>
  `;

  document
    .getElementById("device-detail-back")
    .addEventListener("click", async () => {
      renderDevicesPage();
      await initializeDevicesPage();
    });

  const historyButton = document.getElementById("device-detail-history");

  historyButton.addEventListener("click", () => {
    document.getElementById("device-detail-history-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  loadDeviceAddress("device-detail-address", device.latitude, device.longitude);
  renderDeviceDetailMap(device);

  const locateButton = document.getElementById("device-detail-locate");

  locateButton.addEventListener("click", () => {
    const latitude = Number(device.latitude);
    const longitude = Number(device.longitude);

    if (!deviceDetailMap) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    deviceDetailMap.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      duration: 1000,
    });
  });
}
// Lấy class trạng thái chuyển động
function getMotionClass(value) {
  if (value === true) return "device-detail__status--moving";
  if (value === false) return "device-detail__status--stopped";
  return "device-detail__status--unknown";
}
// Hiển thị bản đồ chi tiết thiết bị
function renderDeviceDetailMap(device) {
  const latitude = Number(device.latitude);
  const longitude = Number(device.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

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

// Hiển thị trạng thái đang tải
function renderLoadingRow(tableBody) {
  tableBody.replaceChildren();

  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 3;
  cell.className = "devices-table__message";
  cell.textContent = "Đang tải danh sách thiết bị...";

  row.append(cell);
  tableBody.append(row);
}

// Hiển thị trạng thái trống
function renderEmptyRow(tableBody, message) {
  tableBody.replaceChildren();

  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 3;
  cell.className = "devices-table__message";
  cell.textContent = message;

  row.append(cell);
  tableBody.append(row);
}

// Cập nhật phân trang
function updatePagination() {
  const totalPages = getTotalPages();
  const resultCount = document.getElementById("devices-result-count");
  const pageInfo = document.getElementById("devices-page-info");
  const previousButton = document.getElementById("devices-prev");
  const nextButton = document.getElementById("devices-next");

  resultCount.textContent = `${filteredDevices.length} thiết bị`;
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
}

function getTotalPages() {
  return Math.max(1, Math.ceil(filteredDevices.length / pageSize));
}

// SQL datetime có thể được trả về không kèm Z; trường này luôn là UTC.
function parseReportTime(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = value.trim();
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  const date = new Date(hasTimeZone ? timestamp : `${timestamp}Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatUpdateTime(date) {
  const elapsedSeconds = (Date.now() - date.getTime()) / 1000;
  if (elapsedSeconds < 0 || elapsedSeconds >= 7 * 86400) {
    return localDateFormatter.format(date);
  }
  if (elapsedSeconds < 60) return "Vừa xong";
  for (const [unit, seconds] of [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]) {
    if (elapsedSeconds >= seconds) {
      return relativeTimeFormatter.format(
        -Math.floor(elapsedSeconds / seconds),
        unit,
      );
    }
  }
}

// Hiển thị ô trạng thái
function renderDeviceStat(label, value) {
  return `
    <div class="device-detail__stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

// Định dạng trạng thái chuyển động
function getMotionText(value) {
  if (value === true) return "Đang di chuyển";
  if (value === false) return "Đứng yên";
  return "Không xác định";
}

// Định dạng tốc độ
function formatSpeed(value) {
  const speed = Number(value);
  return Number.isFinite(speed) ? `${speed.toFixed(1)} km/h` : "—";
}

// Định dạng hướng
function formatHeading(value) {
  const heading = Number(value);
  return Number.isFinite(heading) ? `${heading.toFixed(0)}°` : "—";
}

// Định dạng pin
function formatBattery(value) {
  const battery = Number(value);

  if (!Number.isFinite(battery)) return "—";

  return `${(battery / 1000).toFixed(2)} V`;
}

// Định dạng tọa độ
function formatCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate.toFixed(6) : "—";
}

// Chống chèn HTML
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
