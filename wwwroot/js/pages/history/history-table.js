// wwwroot/js/pages/history/history-table.js
import { formatDate } from "../../popup.js";
import { openHistoryDetail } from "./history-detail.js";
import {
  escapeHtml,
  formatBattery,
  formatCoordinate,
  formatHeading,
  formatSpeed,
  formatTemperature,
} from "./history-formatters.js";

export function renderHistoryTable(
  data,
  currentPage,
  pageSize,
  errorMessage = "",
) {
  const tableBody = document.getElementById("history-table-body");

  if (!tableBody) return;

  tableBody.replaceChildren();

  if (errorMessage) {
    renderEmptyRow(tableBody, errorMessage);
    updatePagination(data, currentPage, pageSize);
    return;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const pageData = data.slice(startIndex, startIndex + pageSize);

  if (!pageData.length) {
    renderEmptyRow(tableBody, "Không có dữ liệu phù hợp.");
    updatePagination(data, currentPage, pageSize);
    return;
  }

  for (const item of pageData) {
    const row = document.createElement("tr");

    row.className = "history-table__row";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `Xem chi tiết bản tin ${item.logId}`);

    row.innerHTML = `
      <td><strong>${escapeHtml(item.mobileId ?? "—")}</strong></td>
      <td>${formatDate(item.messageUtc)}</td>
      <td>
        <span class="history-message-type">
          ${escapeHtml(item.messageTypeName ?? "—")}
        </span>
      </td>
      <td>
        <span class="history-coordinate">
          ${formatCoordinate(item.latitude, item.longitude)}
        </span>
      </td>
      <td>${formatSpeed(item.speedKmh)}</td>
      <td>${formatHeading(item.headingDeg)}</td>
      <td>${renderMotionState(item.motionState)}</td>
      <td>${formatBattery(item.batteryVoltage)}</td>
      <td>${formatTemperature(item.internalTemperatureC)}</td>
      <td>${renderStaleFix(item.staleFix)}</td>
    `;

    row.addEventListener("click", () => openHistoryDetail(item.logId));

    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      openHistoryDetail(item.logId);
    });

    tableBody.append(row);
  }

  updatePagination(data, currentPage, pageSize);
}

function renderEmptyRow(tableBody, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  const empty = document.createElement("div");

  cell.colSpan = 10;
  empty.className = "history-empty";
  empty.textContent = message;

  cell.append(empty);
  row.append(cell);
  tableBody.append(row);
}

function updatePagination(data, currentPage, pageSize) {
  const totalPages = getTotalPages(data, pageSize);
  const resultCount = document.getElementById("history-result-count");
  const pageInfo = document.getElementById("history-page-info");
  const previousButton = document.getElementById("history-prev");
  const nextButton = document.getElementById("history-next");

  resultCount.textContent = `${data.length} bản tin`;
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
}

export function getTotalPages(data, pageSize) {
  return Math.max(1, Math.ceil(data.length / pageSize));
}

function renderMotionState(value) {
  if (value === true) {
    return `
      <span class="history-status history-status--moving">
        Di chuyển
      </span>
    `;
  }

  if (value === false) {
    return `
      <span class="history-status history-status--stopped">
        Đứng yên
      </span>
    `;
  }

  return `
    <span class="history-status history-status--unknown">
      Không rõ
    </span>
  `;
}

function renderStaleFix(value) {
  if (value === true) {
    return `
      <span class="history-stale history-stale--yes">
        Có
      </span>
    `;
  }

  if (value === false) {
    return `
      <span class="history-stale history-stale--no">
        Không
      </span>
    `;
  }

  return "—";
}
