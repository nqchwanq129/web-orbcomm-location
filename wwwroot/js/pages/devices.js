// wwwroot/js/pages/devices.js

import { getDevices } from "../api.js?v=2";

let devicesData = [];
let filteredDevices = [];
let currentPage = 1;
const pageSize = 12;
const addressCache = new Map();
let updateTimeTimer;
const localDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hourCycle: "h23", timeZoneName: "short",
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
    <td class="devices-table__updated"></td>
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
  }

  updatePagination();
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
  for (const [unit, seconds] of [["day", 86400], ["hour", 3600], ["minute", 60]]) {
    if (elapsedSeconds >= seconds) {
      return relativeTimeFormatter.format(-Math.floor(elapsedSeconds / seconds), unit);
    }
  }
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
