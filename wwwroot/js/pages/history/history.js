// wwwroot/js/pages/history/history.js
import { getDeviceHistory } from "../../api.js";
import {
  getHistoryFilters,
  initializeDeviceSelect,
  initializeMessageTypeSelect,
  setDefaultDateRange,
} from "./history-filters.js";
import { formatRange } from "./history-formatters.js";
import { getTotalPages, renderHistoryTable } from "./history-table.js";

let historyData = [];
let currentPage = 1;
const pageSize = 15;

// Hiển thị trang lịch sử
export function renderHistoryPage() {
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <section class="history-page">
      <div class="history-page__header">
        <div>
          <span class="history-page__eyebrow">Lịch sử</span>
          <h1 class="history-page__title">Lịch sử hành trình</h1>
          <p class="history-page__subtitle">
            Tra cứu vị trí, trạng thái và dữ liệu bản tin của thiết bị theo thời gian.
          </p>
        </div>
      </div>

      <div class="history-card">
        <div class="history-card__header">
          <div>
            <h2>Tra cứu lịch sử</h2>
            <p>Chọn thiết bị và khoảng thời gian cần kiểm tra.</p>
          </div>
        </div>

        <div class="history-filters">
          <div class="history-field">
            <label for="history-device">
              Thiết bị <span class="history-device-hint">Nhập hoặc chọn</span>
            </label>
            <div class="history-device-input">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5"></circle>
                <path d="m16 16 4 4"></path>
              </svg>
              <input
                id="history-device"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="history-device-options"
                aria-describedby="history-device-help"
                placeholder="Tất cả thiết bị"
                autocomplete="off"
                spellcheck="false"
              />
              <div
                id="history-device-options"
                class="history-device-options"
                role="listbox"
                aria-label="Thiết bị"
                hidden>
              </div>
            </div>
            <span id="history-device-help" class="history-device-help">
              Nhập Mobile ID để tìm hoặc chọn gợi ý. Để trống để xem tất cả thiết bị.
            </span>
          </div>

          <div class="history-field">
            <label for="history-from">Từ ngày giờ</label>
            <input id="history-from" type="datetime-local" />
          </div>

          <div class="history-field">
            <label for="history-to">Đến ngày giờ</label>
            <input id="history-to" type="datetime-local" />
          </div>

          <div class="history-field">
            <label for="history-type">Loại bản tin</label>
            <select id="history-type">
              <option value="all">Tất cả</option>
              <option value="positionBasicReport">Position Basic Report</option>
              <option value="positionPlusReport">Position Plus Report</option>
              <option value="positionServiceHours">Position Service Hours</option>
              <option value="positionSingleSensor">Position Single Sensor</option>
              <option value="positionMultiSensors">Position Multi Sensors</option>
              <option value="positionServiceHoursSensors">Position Service Hours Sensors</option>
              <option value="diagnosticReport">Diagnostic Report</option>
              <option value="blockageReport">Blockage Report</option>
              <option value="shockReport">Shock Report</option>
              <option value="getSensorReply">Get Sensor Reply</option>
              <option value="resetDistressAlertReply">Reset Distress Alert Reply</option>
              <option value="getConfigSummaryReply">Get Config Summary Reply</option>
            </select>
          </div>

          <button id="history-search" class="history-search-button" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M20 20L16.65 16.65"></path>
            </svg>
            <span>Lọc dữ liệu</span>
          </button>
        </div>

        <div class="history-summary">
          <div class="history-summary__item">
            <span>Số bản tin</span>
            <strong id="history-total">0</strong>
          </div>
          <div class="history-summary__item">
            <span>Thiết bị</span>
            <strong id="history-selected-device">Tất cả</strong>
          </div>
          <div class="history-summary__item">
            <span>Khoảng thời gian</span>
            <strong id="history-range">—</strong>
          </div>
        </div>

        <div class="history-table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>Mobile ID</th>
                <th>Thời gian</th>
                <th>Loại bản tin</th>
                <th>Tọa độ</th>
                <th>Tốc độ</th>
                <th>Hướng</th>
                <th>Trạng thái</th>
                <th>Pin</th>
                <th>Nhiệt độ</th>
                <th>Stale fix</th>
              </tr>
            </thead>
            <tbody id="history-table-body"></tbody>
          </table>
        </div>

        <div class="history-footer">
          <span id="history-result-count">0 bản tin</span>
          <div class="history-pagination">
            <button id="history-prev" type="button">‹</button>
            <span id="history-page-info">1 / 1</span>
            <button id="history-next" type="button">›</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Khởi tạo trang lịch sử
export async function initializeHistoryPage({ mobileId = "" } = {}) {
  setDefaultDateRange();
  initializeMessageTypeSelect();

  const deviceInput = document.getElementById("history-device");
  deviceInput.value = mobileId;
  const historyPage = deviceInput.closest(".history-page");
  const searchButton = document.getElementById("history-search");
  const previousButton = document.getElementById("history-prev");
  const nextButton = document.getElementById("history-next");

  historyPage.addEventListener(
    "scroll",
    (event) => {
      const deviceOptions = document.getElementById("history-device-options");

      if (
        event.target !== deviceOptions &&
        document.activeElement === deviceInput
      ) {
        deviceInput.blur();
      }
    },
    { capture: true, passive: true },
  );

  searchButton.addEventListener("click", loadHistory);

  previousButton.addEventListener("click", () => {
    if (currentPage <= 1) return;

    currentPage--;
    renderTable();
  });

  nextButton.addEventListener("click", () => {
    const totalPages = getTotalPages(historyData, pageSize);

    if (currentPage >= totalPages) return;

    currentPage++;
    renderTable();
  });

  await initializeDeviceSelect();

  if (deviceInput.isConnected) {
    loadHistory();
  }
}

// Tải dữ liệu lịch sử
async function loadHistory() {
  const filters = getHistoryFilters();
  const searchButton = document.getElementById("history-search");
  const buttonText = searchButton.querySelector("span");

  searchButton.disabled = true;
  buttonText.textContent = "Đang tải...";

  try {
    const data = await getDeviceHistory(filters);

    if (!searchButton.isConnected) return;

    historyData = data;
    currentPage = 1;

    updateSummary(filters);
    renderTable();
  } catch (error) {
    if (!searchButton.isConnected) return;

    console.error("Không tải được lịch sử:", error);

    historyData = [];
    currentPage = 1;

    renderHistoryTable(
      historyData,
      currentPage,
      pageSize,
      `Không tải được dữ liệu: ${error.message}`,
    );
  } finally {
    if (searchButton.isConnected) {
      searchButton.disabled = false;
      buttonText.textContent = "Lọc dữ liệu";
    }
  }
}

function renderTable() {
  renderHistoryTable(historyData, currentPage, pageSize);
}

function updateSummary({ mobileId, from, to }) {
  document.getElementById("history-total").textContent = historyData.length;
  document.getElementById("history-selected-device").textContent =
    mobileId || "Tất cả";
  document.getElementById("history-range").textContent = formatRange(from, to);
}
