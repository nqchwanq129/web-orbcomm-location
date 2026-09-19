// wwwroot/js/pages/history.js

import { getDeviceHistory } from "../api.js?v=2";
import { formatDate } from "../popup.js";

let historyData = [];

let currentPage = 1;

const pageSize = 15;

/* RENDER PAGE */

export function renderHistoryPage() {
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <section class="history-page">

      <div class="history-page__header">

        <div>

          <span class="history-page__eyebrow">
            Lịch sử
          </span>

          <h1 class="history-page__title">
            Lịch sử hành trình
          </h1>

          <p class="history-page__subtitle">
            Tra cứu vị trí, trạng thái và dữ liệu bản tin của thiết bị theo thời gian.
          </p>

        </div>

      </div>


      <div class="history-card">

        <div class="history-card__header">

          <div>

            <h2>
              Tra cứu lịch sử
            </h2>

            <p>
              Chọn thiết bị và khoảng thời gian cần kiểm tra.
            </p>

          </div>

        </div>


        <div class="history-filters">

          <div class="history-field">

            <label for="history-device">
              Thiết bị
            </label>

            <input
              id="history-device"
              type="text"
              placeholder="Nhập Mobile ID"
              autocomplete="off"
            />

          </div>


          <div class="history-field">

            <label for="history-from">
              Từ ngày giờ
            </label>

            <input
              id="history-from"
              type="datetime-local"
            />

          </div>


          <div class="history-field">

            <label for="history-to">
              Đến ngày giờ
            </label>

            <input
              id="history-to"
              type="datetime-local"
            />

          </div>


          <div class="history-field">

            <label for="history-type">
              Loại bản tin
            </label>

            <select id="history-type">

              <option value="all">
                Tất cả
              </option>

              <option value="positionPlusReport">
                Position Plus Report
              </option>

              <option value="positionServiceHours">
                Position Service Hours
              </option>

            </select>

          </div>


          <button
            id="history-search"
            class="history-search-button"
            type="button">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true">

              <circle
                cx="11"
                cy="11"
                r="7">
              </circle>

              <path
                d="M20 20L16.65 16.65">
              </path>

            </svg>

            <span>
              Lọc dữ liệu
            </span>

          </button>

        </div>


        <div class="history-summary">

          <div class="history-summary__item">

            <span>
              Số bản tin
            </span>

            <strong id="history-total">
              0
            </strong>

          </div>


          <div class="history-summary__item">

            <span>
              Thiết bị
            </span>

            <strong id="history-selected-device">
              Tất cả
            </strong>

          </div>


          <div class="history-summary__item">

            <span>
              Khoảng thời gian
            </span>

            <strong id="history-range">
              —
            </strong>

          </div>

        </div>


        <div class="history-table-wrapper">

          <table class="history-table">

            <thead>

              <tr>

                <th>
                  Mobile ID
                </th>

                <th>
                  Thời gian
                </th>

                <th>
                  Loại bản tin
                </th>

                <th>
                  Tọa độ
                </th>

                <th>
                  Tốc độ
                </th>

                <th>
                  Hướng
                </th>

                <th>
                  Trạng thái
                </th>

                <th>
                  Pin
                </th>

                <th>
                  Nhiệt độ
                </th>

                <th>
                  Stale fix
                </th>

              </tr>

            </thead>

            <tbody id="history-table-body">

            </tbody>

          </table>

        </div>


        <div class="history-footer">

          <span id="history-result-count">
            0 bản tin
          </span>


          <div class="history-pagination">

            <button
              id="history-prev"
              type="button">
              ‹
            </button>

            <span id="history-page-info">
              1 / 1
            </span>

            <button
              id="history-next"
              type="button">
              ›
            </button>

          </div>

        </div>

      </div>

    </section>
  `;
}

/* INITIALIZE */

export function initializeHistoryPage() {
  setDefaultDateRange();

  const searchButton = document.getElementById("history-search");

  const previousButton = document.getElementById("history-prev");

  const nextButton = document.getElementById("history-next");

  searchButton.addEventListener("click", loadHistory);

  previousButton.addEventListener("click", () => {
    if (currentPage <= 1) {
      return;
    }

    currentPage--;

    renderHistoryTable();
  });

  nextButton.addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) {
      return;
    }

    currentPage++;

    renderHistoryTable();
  });

  loadHistory();
}

/* LOAD HISTORY */

async function loadHistory() {
  const mobileId = document.getElementById("history-device").value.trim();

  const from = document.getElementById("history-from").value;

  const to = document.getElementById("history-to").value;

  const messageType = document.getElementById("history-type").value;

  const searchButton = document.getElementById("history-search");

  searchButton.disabled = true;

  const buttonText = searchButton.querySelector("span");

  buttonText.textContent = "Đang tải...";

  try {
    const data = await getDeviceHistory({
      mobileId,
      from,
      to,
      messageType,
    });

    if (!searchButton.isConnected) {
      return;
    }

    historyData = data;

    currentPage = 1;

    updateSummary({
      mobileId,
      from,
      to,
    });

    renderHistoryTable();
  } catch (error) {
    if (!searchButton.isConnected) {
      return;
    }

    console.error("Không tải được lịch sử:", error);

    historyData = [];

    currentPage = 1;

    renderHistoryTable(`Không tải được dữ liệu: ${error.message}`);
  } finally {
    searchButton.disabled = false;

    buttonText.textContent = "Lọc dữ liệu";
  }
}

/* RENDER TABLE */

function renderHistoryTable(errorMessage = "") {
  const tableBody = document.getElementById("history-table-body");

  if (!tableBody) {
    return;
  }

  tableBody.replaceChildren();

  if (errorMessage) {
    renderEmptyRow(tableBody, errorMessage);

    updatePagination();

    return;
  }

  const start = (currentPage - 1) * pageSize;

  const end = start + pageSize;

  const pageData = historyData.slice(start, end);

  if (pageData.length === 0) {
    renderEmptyRow(tableBody, "Không có dữ liệu phù hợp.");

    updatePagination();

    return;
  }

  for (const item of pageData) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>

        <strong>
          ${escapeHtml(item.mobileId ?? "—")}
        </strong>

      </td>


      <td>
        ${formatDate(item.messageUtc)}
      </td>


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


      <td>
        ${formatSpeed(item.speedKmh)}
      </td>


      <td>
        ${formatHeading(item.headingDeg)}
      </td>


      <td>
        ${renderMotionState(item.motionState)}
      </td>


      <td>
        ${formatBattery(item.batteryVoltage)}
      </td>


      <td>
        ${formatTemperature(item.internalTemperatureC)}
      </td>


      <td>
        ${renderStaleFix(item.staleFix)}
      </td>
    `;

    tableBody.append(row);
  }

  updatePagination();
}

/* EMPTY */

function renderEmptyRow(tableBody, message) {
  const row = document.createElement("tr");

  const cell = document.createElement("td");

  cell.colSpan = 10;

  const empty = document.createElement("div");

  empty.className = "history-empty";

  empty.textContent = message;

  cell.append(empty);

  row.append(cell);

  tableBody.append(row);
}

/* SUMMARY */

function updateSummary({ mobileId, from, to }) {
  const totalElement = document.getElementById("history-total");

  const deviceElement = document.getElementById("history-selected-device");

  const rangeElement = document.getElementById("history-range");

  totalElement.textContent = historyData.length;

  deviceElement.textContent = mobileId || "Tất cả";

  rangeElement.textContent = formatRange(from, to);
}

/* PAGINATION */

function updatePagination() {
  const totalPages = getTotalPages();

  const resultCount = document.getElementById("history-result-count");

  const pageInfo = document.getElementById("history-page-info");

  const previousButton = document.getElementById("history-prev");

  const nextButton = document.getElementById("history-next");

  resultCount.textContent = `${historyData.length} bản tin`;

  pageInfo.textContent = `${currentPage} / ${totalPages}`;

  previousButton.disabled = currentPage <= 1;

  nextButton.disabled = currentPage >= totalPages;
}

function getTotalPages() {
  return Math.max(1, Math.ceil(historyData.length / pageSize));
}

/* FORMAT */

function formatCoordinate(latitude, longitude) {
  const lat = Number(latitude);

  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "—";
  }

  return `${lat.toFixed(6)}, ` + `${lng.toFixed(6)}`;
}

function formatSpeed(value) {
  const speed = Number(value);

  if (!Number.isFinite(speed)) {
    return "—";
  }

  return `${speed.toFixed(1)} km/h`;
}

function formatHeading(value) {
  const heading = Number(value);

  if (!Number.isFinite(heading)) {
    return "—";
  }

  return `${heading.toFixed(0)}°`;
}

function formatBattery(value) {
  const battery = Number(value);

  if (!Number.isFinite(battery)) {
    return "—";
  }

  return `${battery.toFixed(2)} V`;
}

function formatTemperature(value) {
  const temperature = Number(value);

  if (!Number.isFinite(temperature)) {
    return "—";
  }

  return `${temperature.toFixed(1)} °C`;
}

/* STATUS */

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

/* DATE RANGE */

function formatRange(from, to) {
  if (!from && !to) {
    return "Tất cả thời gian";
  }

  if (!from) {
    return `Đến ${formatInputDate(to)}`;
  }

  if (!to) {
    return `Từ ${formatInputDate(from)}`;
  }

  return `${formatInputDate(from)} → ` + `${formatInputDate(to)}`;
}

function formatInputDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* DEFAULT RANGE */

function setDefaultDateRange() {
  document.getElementById("history-from").value = "";
  document.getElementById("history-to").value = "";
}

/* SECURITY */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
