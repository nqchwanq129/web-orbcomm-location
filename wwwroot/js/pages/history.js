// wwwroot/js/pages/history.js
import {
  getDevices,
  getDeviceHistory,
  getDeviceHistoryDetail,
} from "../api.js?v=2";
import { formatDate } from "../popup.js";

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

// Khởi tạo trang
export async function initializeHistoryPage() {
  setDefaultDateRange();
  initializeMessageTypeSelect();

  const deviceInput = document.getElementById("history-device");
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
    renderHistoryTable();
  });

  nextButton.addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) return;

    currentPage++;
    renderHistoryTable();
  });

  await loadDeviceOptions();

  if (deviceInput.isConnected) {
    loadHistory();
  }
}

// Khởi tạo bộ chọn loại bản tin
function initializeMessageTypeSelect() {
  const select = document.getElementById("history-type");
  const wrapper = document.createElement("div");

  wrapper.className = "history-type-select";
  select.before(wrapper);
  wrapper.append(select);
  select.hidden = true;

  const trigger = document.createElement("button");

  trigger.type = "button";
  trigger.id = "history-type-trigger";
  trigger.className = "history-type-trigger";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "history-type-options");
  trigger.textContent = select.selectedOptions[0].textContent.trim();

  const label = document.querySelector('label[for="history-type"]');

  label.htmlFor = trigger.id;
  label.id = "history-type-label";
  trigger.setAttribute("aria-labelledby", label.id);

  const list = document.createElement("div");

  list.id = "history-type-options";
  list.className = "history-device-options";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-labelledby", label.id);
  list.hidden = true;
  wrapper.append(trigger, list);

  let activeIndex = select.selectedIndex;

  const close = () => {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
  };

  const highlight = () => {
    [...list.children].forEach((item, index) => {
      item.setAttribute("aria-selected", String(index === activeIndex));
    });

    const activeItem = list.children[activeIndex];

    if (!activeItem) return;

    trigger.setAttribute("aria-activedescendant", activeItem.id);
    list.scrollTop = Math.max(0, activeItem.offsetTop - list.clientHeight / 2);
  };

  const open = () => {
    activeIndex = select.selectedIndex;
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    highlight();
  };

  const choose = (index) => {
    select.selectedIndex = index;
    trigger.textContent = select.options[index].textContent.trim();
    select.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  };

  [...select.options].forEach((option, index) => {
    const item = document.createElement("div");

    item.id = `history-type-option-${index}`;
    item.setAttribute("role", "option");
    item.textContent = option.textContent.trim();
    item.addEventListener("click", () => choose(index));
    list.append(item);
  });

  list.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  trigger.addEventListener("click", () => {
    if (list.hidden) {
      open();
    } else {
      close();
    }
  });

  trigger.addEventListener("blur", close);

  trigger.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();

      if (list.hidden) {
        open();
        return;
      }

      if (event.key === "Home") {
        activeIndex = 0;
      } else if (event.key === "End") {
        activeIndex = select.options.length - 1;
      } else {
        const direction = event.key === "ArrowDown" ? 1 : -1;

        activeIndex =
          (activeIndex + direction + select.options.length) %
          select.options.length;
      }

      highlight();
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && !list.hidden) {
      event.preventDefault();
      choose(activeIndex);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });

  wrapper.closest(".history-page").addEventListener(
    "scroll",
    (event) => {
      if (event.target !== list) {
        close();
      }
    },
    { capture: true, passive: true },
  );
}

// Tải danh sách thiết bị
async function loadDeviceOptions() {
  const dataList = document.getElementById("history-device-options");
  const input = document.getElementById("history-device");

  if (!dataList || !input) return;

  let deviceIds = [];
  let activeIndex = -1;

  const close = () => {
    dataList.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  };

  const choose = (value) => {
    input.value = value;
    close();
  };

  const highlight = (options) => {
    options.forEach((option, index) => {
      option.setAttribute("aria-selected", String(index === activeIndex));
    });

    const activeOption = options[activeIndex];

    if (!activeOption) return;

    input.setAttribute("aria-activedescendant", activeOption.id);

    if (activeOption.offsetTop < dataList.scrollTop) {
      dataList.scrollTop = activeOption.offsetTop;
    } else if (
      activeOption.offsetTop + activeOption.offsetHeight >
      dataList.scrollTop + dataList.clientHeight
    ) {
      dataList.scrollTop =
        activeOption.offsetTop +
        activeOption.offsetHeight -
        dataList.clientHeight;
    }
  };

  const open = () => {
    const query = input.value.trim().toLowerCase();
    const filteredIds = deviceIds.filter((id) =>
      id.toLowerCase().includes(query),
    );

    dataList.replaceChildren();
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");

    for (const id of filteredIds) {
      const option = document.createElement("div");

      option.id = `history-device-option-${dataList.children.length}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = id;
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      option.addEventListener("click", () => choose(id));
      dataList.append(option);
    }

    if (!dataList.children.length) {
      const empty = document.createElement("div");

      empty.className = "history-device-options__empty";
      empty.textContent = "Không có thiết bị gợi ý";
      dataList.append(empty);
    }

    dataList.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("focus", open);
  input.addEventListener("click", open);
  input.addEventListener("input", open);
  input.addEventListener("blur", close);

  dataList.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (dataList.hidden) {
        open();
      }

      const options = [...dataList.querySelectorAll('[role="option"]')];

      if (!options.length) return;

      if (activeIndex < 0) {
        activeIndex = event.key === "ArrowDown" ? 0 : options.length - 1;
      } else {
        const direction = event.key === "ArrowDown" ? 1 : -1;

        activeIndex =
          (activeIndex + direction + options.length) % options.length;
      }

      highlight(options);
      return;
    }

    if (event.key === "Enter" && !dataList.hidden && activeIndex >= 0) {
      event.preventDefault();

      const options = dataList.querySelectorAll('[role="option"]');
      choose(options[activeIndex].textContent);
    }
  });

  try {
    const devices = await getDevices();

    if (!input.isConnected) return;

    deviceIds = [
      ...new Set(devices.map((device) => device.mobileId).filter(Boolean)),
    ];

    if (document.activeElement === input) {
      open();
    }
  } catch (error) {
    console.error("Không tải được danh sách thiết bị:", error);
  }
}

// Tải dữ liệu lịch sử
async function loadHistory() {
  const mobileId = document.getElementById("history-device").value.trim();
  const from = document.getElementById("history-from").value;
  const to = document.getElementById("history-to").value;
  const messageType = document.getElementById("history-type").value;
  const searchButton = document.getElementById("history-search");
  const buttonText = searchButton.querySelector("span");

  searchButton.disabled = true;
  buttonText.textContent = "Đang tải...";

  try {
    const data = await getDeviceHistory({
      mobileId,
      from,
      to,
      messageType,
    });

    if (!searchButton.isConnected) return;

    historyData = data;
    currentPage = 1;

    updateSummary({
      mobileId,
      from,
      to,
    });

    renderHistoryTable();
  } catch (error) {
    if (!searchButton.isConnected) return;

    console.error("Không tải được lịch sử:", error);

    historyData = [];
    currentPage = 1;
    renderHistoryTable(`Không tải được dữ liệu: ${error.message}`);
  } finally {
    if (searchButton.isConnected) {
      searchButton.disabled = false;
      buttonText.textContent = "Lọc dữ liệu";
    }
  }
}

async function openHistoryDetail(logId) {
  createHistoryDetailModal();

  const modal = document.getElementById("history-detail-modal");
  const content = document.getElementById("history-detail-content");

  modal.hidden = false;
  document.body.classList.add("history-modal-open");

  content.innerHTML = `
    <div class="history-detail-loading">
      Đang tải chi tiết bản tin...
    </div>
  `;

  try {
    const detail = await getDeviceHistoryDetail(logId);

    if (!modal.isConnected) return;

    renderHistoryDetail(detail);
  } catch (error) {
    content.innerHTML = `
      <div class="history-detail-error">
        Không tải được chi tiết: ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// Hiển thị bảng lịch sử
function renderHistoryTable(errorMessage = "") {
  const tableBody = document.getElementById("history-table-body");

  if (!tableBody) return;

  tableBody.replaceChildren();

  if (errorMessage) {
    renderEmptyRow(tableBody, errorMessage);
    updatePagination();
    return;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = historyData.slice(startIndex, endIndex);

  if (!pageData.length) {
    renderEmptyRow(tableBody, "Không có dữ liệu phù hợp.");
    updatePagination();
    return;
  }

  for (const item of pageData) {
    const row = document.createElement("tr");

    row.className = "history-table__row";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `Xem chi tiết bản tin ${item.logId}`);

    row.innerHTML = `
    <td>
      <strong>${escapeHtml(item.mobileId ?? "—")}</strong>
    </td>
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

    row.addEventListener("click", () => {
      openHistoryDetail(item.logId);
    });

    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openHistoryDetail(item.logId);
      }
    });

    tableBody.append(row);
  }

  updatePagination();
}

// Hiển thị trạng thái trống
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

// Cập nhật thông tin tổng quan
function updateSummary({ mobileId, from, to }) {
  const totalElement = document.getElementById("history-total");
  const deviceElement = document.getElementById("history-selected-device");
  const rangeElement = document.getElementById("history-range");

  totalElement.textContent = historyData.length;
  deviceElement.textContent = mobileId || "Tất cả";
  rangeElement.textContent = formatRange(from, to);
}

function createHistoryDetailModal() {
  if (document.getElementById("history-detail-modal")) return;

  const modal = document.createElement("div");

  modal.id = "history-detail-modal";
  modal.className = "history-detail-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="history-detail-modal__backdrop"></div>

    <section
      class="history-detail-modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-detail-title">

      <header class="history-detail-modal__header">
        <div>
          <h2 id="history-detail-title">
            Chi tiết bản tin
          </h2>

          <p id="history-detail-subtitle"></p>
        </div>

        <button
          id="history-detail-close"
          class="history-detail-modal__close"
          type="button"
          aria-label="Đóng">
          ×
        </button>
      </header>

      <div
        id="history-detail-content"
        class="history-detail-modal__content">
      </div>
    </section>
  `;

  document.body.append(modal);

  modal
    .querySelector(".history-detail-modal__backdrop")
    .addEventListener("click", closeHistoryDetail);

  modal
    .querySelector("#history-detail-close")
    .addEventListener("click", closeHistoryDetail);

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeHistoryDetail();
    }
  });
}
function renderHistoryDetail(detail) {
  const title = document.getElementById("history-detail-title");
  const subtitle = document.getElementById("history-detail-subtitle");
  const content = document.getElementById("history-detail-content");

  title.textContent = `Chi tiết bản tin #${detail.logId}`;
  subtitle.textContent = `${detail.mobileId} • ${detail.messageTypeName ?? "Không rõ"}`;

  content.innerHTML = `
    ${renderDetailSection("Thông tin chung", [
      ["Log ID", detail.logId],
      ["OGWS Message ID", detail.ogwsMessageId],
      ["Mobile ID", detail.mobileId],
      ["Loại bản tin", detail.messageTypeName],
      ["Thời gian bản tin", formatDate(detail.messageUtc)],
      ["Thời gian nhận", formatDate(detail.receiveUtc)],
      ["Thời gian báo cáo", formatDate(detail.reportTimestampUtc)],
      ["Created At", formatDate(detail.createdAt)],
    ])}

    ${renderDetailSection("Vị trí & thiết bị", [
      ["Vĩ độ", detail.latitude],
      ["Kinh độ", detail.longitude],
      ["Tốc độ", formatSpeed(detail.speedKmh)],
      ["Hướng", formatHeading(detail.headingDeg)],
      ["Đang di chuyển", formatBoolean(detail.motionState)],
      ["Stale fix", formatBoolean(detail.staleFix)],
      ["Điện áp pin", formatBattery(detail.batteryVoltage)],
      ["Nhiệt độ trong", formatTemperature(detail.internalTemperatureC)],
    ])}

    ${renderDetailSection("Thông tin báo cáo", [
      ["SIN", detail.sin],
      ["MIN", detail.min],
      ["Mã nguồn báo cáo", detail.reportSourceCode],
      ["Nguồn báo cáo", detail.reportSourceName],
      ["Trạng thái dịch vụ", detail.serviceStatus],
      ["Số giờ dịch vụ", detail.serviceHours],
      ["Sensor Trigger ID", detail.sensorTriggerId],
    ])}

    ${renderDetailSection("Thông tin nâng cao", [
      ["GNSS Jamming", detail.rawGnssJammingValue],
      ["Số bản tin bị rớt", detail.droppedMessageCount],
      ["Mất tín hiệu", formatSeconds(detail.blockageDurationSec)],
      ["Gia tốc X", formatAcceleration(detail.xAccelerationMg)],
      ["Gia tốc Y", formatAcceleration(detail.yAccelerationMg)],
      ["Gia tốc Z", formatAcceleration(detail.zAccelerationMg)],
      ["Reply Sensor Index", detail.replySensorIndex],
      ["Reply Sensor Name", detail.replySensorName],
      ["Reply Sensor Status", detail.replySensorStatus],
      ["Reply Sensor Connected", formatBoolean(detail.replySensorConnected)],
      ["Reset Successful", formatBoolean(detail.resetSuccessful)],
    ])}

    ${renderRawSection("Sensors JSON", detail.sensorsJson)}
    ${renderRawSection("Config Summary JSON", detail.configSummaryJson)}
  `;
}

function renderDetailSection(title, rows) {
  return `
    <section class="history-detail-section">
      <h3>${escapeHtml(title)}</h3>

      <div class="history-detail-grid">
        ${rows
          .map(
            ([label, value]) => `
          <div class="history-detail-field">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(formatDetailValue(value))}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderRawSection(title, value) {
  if (!value) return "";

  return `
    <details class="history-detail-raw">
      <summary>
        ${escapeHtml(title)}
      </summary>

      <pre>${escapeHtml(formatJson(value))}</pre>
    </details>
  `;
}

function formatDetailValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function formatBoolean(value) {
  if (value === true) return "Có";
  if (value === false) return "Không";
  return "—";
}

function formatSeconds(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) return "—";

  return `${seconds} giây`;
}

function formatAcceleration(value) {
  const acceleration = Number(value);

  if (!Number.isFinite(acceleration)) return "—";

  return `${acceleration} mg`;
}

function formatJson(value) {
  if (!value) return "";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function closeHistoryDetail() {
  const modal = document.getElementById("history-detail-modal");

  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("history-modal-open");
}

// Cập nhật phân trang
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

// Định dạng dữ liệu
function formatCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "—";
  }

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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

// Hiển thị trạng thái chuyển động
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

// Hiển thị trạng thái stale fix
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

// Định dạng khoảng thời gian
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

  return `${formatInputDate(from)} → ${formatInputDate(to)}`;
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

// Thiết lập khoảng thời gian mặc định
function setDefaultDateRange() {
  document.getElementById("history-from").value = "";
  document.getElementById("history-to").value = "";
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
