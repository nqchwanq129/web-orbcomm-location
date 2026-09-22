import { getDevices } from "../../api.js";
import { renderDeviceDetailPage } from "./device-detail.js";
import {
  renderDevicesTable,
  renderEmptyRow,
  renderLoadingRow,
} from "./devices-table.js";
import { formatUpdateTime } from "./devices-formatters.js";

let devicesData = [];
let filteredDevices = [];
let currentPage = 1;
const pageSize = 12;
let updateTimeTimer;

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
                <th class="devices-table__updated-heading">
                  Cập nhật lần cuối
                </th>
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

            <span id="devices-page-info">1 / 1</span>

            <button id="devices-next" type="button" aria-label="Trang sau">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

export async function initializeDevicesPage() {
  const searchInput = document.getElementById("devices-search");
  const previousButton = document.getElementById("devices-prev");
  const nextButton = document.getElementById("devices-next");
  const tableBody = document.getElementById("devices-table-body");

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    filterDevices();
  });

  previousButton.addEventListener("click", () => {
    if (currentPage <= 1) return;

    currentPage--;
    renderTable();
  });

  nextButton.addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) return;

    currentPage++;
    renderTable();
  });

  await loadDevices();

  if (!tableBody?.isConnected) return;

  startUpdateTimeTimer(tableBody);
}

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

    renderTable();
  } catch (error) {
    if (!tableBody.isConnected) return;

    console.error("Không tải được danh sách thiết bị:", error);

    devicesData = [];
    filteredDevices = [];
    currentPage = 1;

    totalText.textContent = "Không tải được dữ liệu";

    renderEmptyRow(tableBody, `Không tải được dữ liệu: ${error.message}`);

    updatePagination();
  }
}

function filterDevices() {
  const keyword = document
    .getElementById("devices-search")
    .value.trim()
    .toLowerCase();

  filteredDevices = devicesData.filter((device) => {
    return (device.mobileId ?? "").toLowerCase().includes(keyword);
  });

  renderTable();
}

function renderTable() {
  renderDevicesTable({
    devices: filteredDevices,
    currentPage,
    pageSize,
    onSelectDevice: openDeviceDetail,
  });

  updatePagination();
}

function openDeviceDetail(device) {
  clearTimeout(updateTimeTimer);

  renderDeviceDetailPage(device, async () => {
    renderDevicesPage();
    await initializeDevicesPage();
  });
}

function updatePagination() {
  const totalPages = getTotalPages();
  const resultCount = document.getElementById("devices-result-count");
  const pageInfo = document.getElementById("devices-page-info");
  const previousButton = document.getElementById("devices-prev");
  const nextButton = document.getElementById("devices-next");

  if (!resultCount || !pageInfo || !previousButton || !nextButton) return;

  resultCount.textContent = `${filteredDevices.length} thiết bị`;
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
}

function getTotalPages() {
  return Math.max(1, Math.ceil(filteredDevices.length / pageSize));
}

function startUpdateTimeTimer(tableBody) {
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
