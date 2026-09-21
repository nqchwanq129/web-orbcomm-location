// wwwroot/js/pages/devices/devices-table.js

import { loadDeviceAddress } from "./devices-location.js";
import {
  escapeHtml,
  formatUpdateTime,
  localDateFormatter,
  parseReportTime,
} from "./devices-formatters.js";

// Hiển thị bảng thiết bị
export function renderDevicesTable({
  devices,
  currentPage,
  pageSize,
  onSelectDevice,
}) {
  const tableBody = document.getElementById("devices-table-body");

  if (!tableBody) return;

  tableBody.replaceChildren();

  const startIndex = (currentPage - 1) * pageSize;
  const pageData = devices.slice(startIndex, startIndex + pageSize);

  if (!pageData.length) {
    renderEmptyRow(tableBody, "Không có thiết bị phù hợp.");
    return;
  }

  for (const device of pageData) {
    const row = createDeviceRow(device, onSelectDevice);

    tableBody.append(row);
    loadDeviceAddress(
      `device-location-${device.mobileId}`,
      device.latitude,
      device.longitude,
    );
  }
}

// Tạo dòng thiết bị
function createDeviceRow(device, onSelectDevice) {
  const row = document.createElement("tr");
  const locationId = `device-location-${device.mobileId}`;

  row.className = "devices-table__row";

  row.innerHTML = `
    <td>
      <strong class="devices-table__device">
        ${escapeHtml(device.mobileId ?? "—")}
      </strong>
    </td>
    <td>
      <div class="devices-table__location">
        <span id="${escapeHtml(locationId)}" class="devices-table__address">
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

  row.addEventListener("click", () => {
    onSelectDevice(device);
  });

  renderUpdateTime(row, device);
  initializeAddressTooltip(row);

  return row;
}

// Hiển thị thời gian cập nhật
function renderUpdateTime(row, device) {
  const updatedCell = row.querySelector(".devices-table__updated");
  const reportTime = parseReportTime(device.reportTimestampUtc);

  if (!reportTime) {
    updatedCell.textContent = "Chưa có dữ liệu";
    return;
  }

  const time = document.createElement("time");

  time.dataset.reportTime = "";
  time.dateTime = reportTime.toISOString();
  time.textContent = formatUpdateTime(reportTime);
  time.title = localDateFormatter.format(reportTime);

  updatedCell.append(time);
}

// Hiển thị tooltip địa chỉ
function initializeAddressTooltip(row) {
  const addressElement = row.querySelector(".devices-table__address");

  addressElement.addEventListener("mouseenter", () => {
    if (addressElement.scrollWidth > addressElement.clientWidth) {
      addressElement.title = addressElement.textContent.trim();
      return;
    }

    addressElement.removeAttribute("title");
  });

  addressElement.addEventListener("mouseleave", () => {
    addressElement.removeAttribute("title");
  });
}

// Hiển thị trạng thái đang tải
export function renderLoadingRow(tableBody) {
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
export function renderEmptyRow(tableBody, message) {
  tableBody.replaceChildren();

  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 3;
  cell.className = "devices-table__message";
  cell.textContent = message;

  row.append(cell);
  tableBody.append(row);
}
