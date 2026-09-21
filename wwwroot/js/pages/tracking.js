import { escapeHtml, parseReportTime, localDateFormatter, formatUpdateTime, getMotionText } from "./devices/devices-formatters.js";

let trackingDevices = [];
let trackingLoaded = false;

function formatTrackingDate(value) {
  const date = parseReportTime(value);
  return date ? localDateFormatter.format(date) : "—";
}

function numberOrNull(value) {
  return value === null || value === undefined || value === "" || !Number.isFinite(Number(value))
    ? null : Number(value);
}

function normalizeTrackingDevice(device) {
  const latitude = numberOrNull(device.latitude);
  const longitude = numberOrNull(device.longitude);
  const hasPosition = latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const updated = parseReportTime(device.updatedAt);
  const status = device.motionState === true ? "moving" : device.motionState === false ? "stopped" : "unknown";
  const heading = numberOrNull(device.headingDeg);
  return {
    ...device,
    latitude, longitude, hasPosition, status,
    statusText: getMotionText(device.motionState),
    updatedText: updated ? formatUpdateTime(updated) : "Chưa có thời gian cập nhật",
    updatedAt: formatTrackingDate(device.updatedAt),
    address: hasPosition ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Chưa có tọa độ hợp lệ",
    speedKph: numberOrNull(device.speedKmh) ?? "—",
    headingText: heading === null ? "Không xác định" : `${heading}°`,
    motionText: getMotionText(device.motionState),
    batteryV: numberOrNull(device.batteryVoltage),
    messageType: device.messageTypeName || "—",
    messageTime: formatTrackingDate(device.messageUtc),
    reportTime: formatTrackingDate(device.reportTimestampUtc),
  };
}

export function updateTrackingDevices(devices) {
  trackingDevices = devices.filter(device => device && typeof device.mobileId === "string" && device.mobileId)
    .map(normalizeTrackingDevice);
  trackingLoaded = true;
  renderTrackingSummary();
  renderTrackingDeviceList();
  if (trackingSelectedMobileId) {
    const selected = getTrackingDevice(trackingSelectedMobileId);
    if (selected) renderTrackingDeviceDetail(selected);
    else closeTrackingDevicePanel();
  }
}

export function setTrackingConnectionStatus(message, isError = false) {
  setText("connection-status", message);
  setText("tracking-detail-connection-status", message);
  document.querySelector(".tracking-map-status")?.classList.toggle("tracking-map-status--error", isError);
  if (!trackingLoaded && isError) {
    document.getElementById("device-list").innerHTML = '<li class="tracking-device-list__empty">Không tải được danh sách thiết bị.</li>';
  }
}

let trackingSelectedMobileId = null;
let trackingCurrentFilter = "all";
let trackingSearchKeyword = "";

export function renderTrackingPage() {
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  trackingDevices = [];
  trackingLoaded = false;
  trackingSelectedMobileId = null;
  trackingCurrentFilter = "all";
  trackingSearchKeyword = "";

  pageContent.innerHTML = `
    <div class="tracking-page">
      <aside class="tracking-sidebar">
        <div class="tracking-sidebar__header">
          <div>
            <span class="tracking-sidebar__eyebrow">Theo dõi</span>
            <h1 class="tracking-sidebar__title">Thiết bị</h1>
          </div>
          <div class="tracking-sidebar__total">
            <strong id="device-count">0</strong>
            <span>thiết bị</span>
          </div>
        </div>

        <div class="tracking-summary">
          <div class="tracking-summary__item">
            <div class="tracking-summary__value">
              <span class="tracking-status-dot tracking-status-dot--moving"></span>
              <strong id="tracking-moving-count">0</strong>
            </div>
            <span>Di chuyển</span>
          </div>
          <div class="tracking-summary__item">
            <div class="tracking-summary__value">
              <span class="tracking-status-dot tracking-status-dot--stopped"></span>
              <strong id="tracking-stopped-count">0</strong>
            </div>
            <span>Đứng yên</span>
          </div>
          <div class="tracking-summary__item">
            <div class="tracking-summary__value">
              <span class="tracking-status-dot tracking-status-dot--stale"></span>
              <strong id="tracking-stale-count">0</strong>
            </div>
            <span>GPS cũ</span>
          </div>
        </div>

        <div class="tracking-sidebar__search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M20 20L16.65 16.65"></path>
          </svg>
          <input id="tracking-device-search" type="search" placeholder="Tìm thiết bị..." autocomplete="off" />

        </div>

        <div class="tracking-sidebar__filters">
          <button class="tracking-sidebar__filter tracking-sidebar__filter--active" type="button" data-filter="all">Tất cả</button>
          <button class="tracking-sidebar__filter" type="button" data-filter="moving">Di chuyển</button>
          <button class="tracking-sidebar__filter" type="button" data-filter="stopped">Đứng yên</button>
          <button class="tracking-sidebar__filter" type="button" data-filter="stale">GPS cũ</button>
        </div>

        <div class="tracking-device-section">
          <div class="tracking-device-section__header">
            <span>Danh sách thiết bị</span>
            <span id="device-visible-count" class="tracking-device-section__count">0</span>
          </div>
          <ul id="device-list" class="tracking-device-list"></ul>
        </div>

        <div class="tracking-sidebar__footer">
          <label class="tracking-auto-refresh">
            <input id="auto-refresh" type="checkbox" checked />
            <span class="tracking-auto-refresh__check"></span>
            <span>Tự động cập nhật</span>
          </label>
          <button id="fit-all-devices" class="tracking-fit-all" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 3H3V8"></path>
              <path d="M16 3H21V8"></path>
              <path d="M8 21H3V16"></path>
              <path d="M16 21H21V16"></path>
            </svg>
            Hiển thị tất cả thiết bị
          </button>
        </div>
      </aside>

      <main class="tracking-map-area">
        <section id="map" class="tracking-map" aria-label="Bản đồ vị trí thiết bị"></section>

        <div class="tracking-map-toolbar">
          <button id="tracking-map-fit-all" type="button" title="Hiển thị tất cả thiết bị">
            <svg viewBox="0 0 24 24">
              <path d="M8 3H3V8"></path>
              <path d="M16 3H21V8"></path>
              <path d="M8 21H3V16"></path>
              <path d="M16 21H21V16"></path>
            </svg>
          </button>
          <button id="tracking-map-focus-selected" type="button" title="Thiết bị đang chọn">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
              <circle cx="12" cy="12" r="8"></circle>
              <path d="M12 2V5"></path>
              <path d="M12 19V22"></path>
              <path d="M2 12H5"></path>
              <path d="M19 12H22"></path>
            </svg>
          </button>

          <button id="tracking-map-fullscreen" type="button" title="Toàn màn hình">
            <svg viewBox="0 0 24 24">
              <path d="M8 3H3V8"></path>
              <path d="M16 3H21V8"></path>
              <path d="M8 21H3V16"></path>
              <path d="M16 21H21V16"></path>
            </svg>
          </button>
        </div>

        <div class="tracking-map-status">
          <span class="tracking-map-status__indicator"></span>
          <span id="connection-status" role="status">Đang tải dữ liệu...</span>
          <strong id="tracking-map-device-count">0 thiết bị</strong>
        </div>

        <div class="tracking-map-legend">
          <div class="tracking-map-legend__header">Chú thích</div>
          <div class="tracking-map-legend__items">
            <div>
              <span class="tracking-status-dot tracking-status-dot--moving"></span>
              <span>Di chuyển</span>
            </div>
            <div>
              <span class="tracking-status-dot tracking-status-dot--stopped"></span>
              <span>Đứng yên</span>
            </div>
            <div>
              <span class="tracking-status-dot tracking-status-dot--stale"></span>
              <span>Dữ liệu cũ</span>
            </div>
            <div>
              <span class="tracking-status-dot tracking-status-dot--unknown"></span>
              <span>Không xác định</span>
            </div>
          </div>
        </div>
      </main>

      <aside id="tracking-device-panel" class="tracking-device-panel" inert>
        <div class="tracking-detail-header">
          <div class="tracking-detail-header__top">
            <div>
              <span class="tracking-detail-header__eyebrow">Chi tiết thiết bị</span>
              <h2 id="tracking-detail-mobile-id">--</h2>
            </div>
            <button id="tracking-detail-close" class="tracking-detail-close" type="button" title="Đóng">
              <svg viewBox="0 0 24 24">
                <path d="M6 6L18 18"></path>
                <path d="M18 6L6 18"></path>
              </svg>
            </button>
          </div>
          <div class="tracking-detail-header__status">
            <span id="tracking-detail-state" class="tracking-device-state">
              <span id="tracking-detail-state-dot" class="tracking-status-dot"></span>
              <span id="tracking-detail-state-text">--</span>
            </span>
            <span id="tracking-detail-updated">--</span>
          </div>
        </div>

        <div class="tracking-detail-content">
          <section class="tracking-detail-section">
            <div class="tracking-detail-section__heading">
              <div>
                <span class="tracking-detail-section__eyebrow">Vị trí hiện tại</span>
                <h3 id="tracking-detail-address">--</h3>
              </div>
              <button id="tracking-detail-locate" class="tracking-detail-location-button" type="button" title="Định vị trên bản đồ">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"></circle>
                  <circle cx="12" cy="12" r="8"></circle>
                  <path d="M12 2V5"></path>
                  <path d="M12 19V22"></path>
                  <path d="M2 12H5"></path>
                  <path d="M19 12H22"></path>
                </svg>
              </button>
            </div>

            <div class="tracking-coordinate-box">
              <div>
                <span>Vĩ độ</span>
                <strong id="tracking-detail-latitude">--</strong>
              </div>
              <div>
                <span>Kinh độ</span>
                <strong id="tracking-detail-longitude">--</strong>
              </div>
              <button id="tracking-copy-coordinate" type="button" title="Sao chép tọa độ">
                <svg viewBox="0 0 24 24">
                  <rect x="8" y="8" width="11" height="11" rx="2"></rect>
                  <path d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8"></path>
                </svg>
              </button>
            </div>
          </section>

          <section class="tracking-detail-section">
            <div class="tracking-detail-section__title">
              <h3>Trạng thái thiết bị</h3>
            </div>
            <div class="tracking-metrics">
              <div class="tracking-metric">
                <div class="tracking-metric__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 17A8 8 0 0 1 20 17"></path>
                    <path d="M12 13L17 8"></path>
                    <circle cx="12" cy="17" r="1"></circle>
                  </svg>
                </div>
                <div>
                  <span>Tốc độ</span>
                  <strong><span id="tracking-detail-speed">--</span> <small>km/h</small></strong>
                </div>
              </div>

              <div class="tracking-metric">
                <div class="tracking-metric__icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M15.5 8.5L13 13L8.5 15.5L11 11L15.5 8.5Z"></path>
                  </svg>
                </div>
                <div>
                  <span>Hướng</span>
                  <strong id="tracking-detail-heading">--</strong>
                </div>
              </div>

              <div class="tracking-metric">
                <div class="tracking-metric__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 17L9 13L12 16L19 9"></path>
                    <path d="M15 9H19V13"></path>
                  </svg>
                </div>
                <div>
                  <span>Chuyển động</span>
                  <strong id="tracking-detail-motion">--</strong>
                </div>
              </div>

              <div class="tracking-metric">
                <div class="tracking-metric__icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="4" y="7" width="15" height="10" rx="2"></rect>
                    <path d="M19 10H21V14H19"></path>
                    <path d="M7 10V14"></path>
                    <path d="M10 10V14"></path>
                    <path d="M13 10V14"></path>
                  </svg>
                </div>
                <div>
                  <span>Điện áp pin</span>
                  <strong><span id="tracking-detail-battery">--</span> <small>V</small></strong>
                </div>
              </div>
            </div>
          </section>

          <section class="tracking-detail-section">
            <div class="tracking-detail-section__title">
              <h3>Chất lượng vị trí GPS</h3>
              <span id="tracking-alert-badge" class="tracking-alert-badge">--</span>
            </div>
            <div id="tracking-alert-content"></div>
          </section>

          <section class="tracking-detail-section">
            <div class="tracking-detail-section__title">
              <h3>Bản tin gần nhất</h3>
              <span id="tracking-message-badge" class="tracking-message-badge">--</span>
            </div>
            <dl class="tracking-detail-info">
              <div><dt>Nguồn báo cáo</dt><dd id="tracking-report-source">—</dd></div>
              <div><dt>Nhiệt độ</dt><dd id="tracking-temperature">—</dd></div>
              <div>
                <dt>Mobile ID</dt>
                <dd id="tracking-message-mobile-id">--</dd>
              </div>
              <div>
                <dt>Log ID</dt>
                <dd id="tracking-message-log-id">--</dd>
              </div>
              <div>
                <dt>Loại bản tin</dt>
                <dd id="tracking-message-type">--</dd>
              </div>
              <div>
                <dt>Thời gian bản tin</dt>
                <dd id="tracking-message-time">--</dd>
              </div>
              <div>
                <dt>Thời gian báo cáo</dt>
                <dd id="tracking-report-time">--</dd>
              </div>
              <div>
                <dt>Cập nhật lúc</dt>
                <dd id="tracking-message-updated">--</dd>
              </div>
            </dl>
          </section>

        </div>

        <div class="tracking-detail-footer">
          <div>
            <span class="tracking-map-status__indicator"></span>
            <span id="tracking-detail-connection-status">Đang tải dữ liệu...</span>
          </div>
          <span id="tracking-detail-footer-time">--</span>
        </div>
      </aside>
    </div>
  `;

  renderTrackingSummary();
  renderTrackingDeviceList();
  bindTrackingUiEvents();
  notifyTrackingMapResize();
}

function renderTrackingSummary() {
  const total = trackingDevices.length;
  const moving = trackingDevices.filter(
    (device) => device.status === "moving",
  ).length;
  const stopped = trackingDevices.filter(
    (device) => device.status === "stopped",
  ).length;
  const stale = trackingDevices.filter(
    (device) => device.staleFix === true,
  ).length;

  setText("device-count", total);
  setText("tracking-moving-count", moving);
  setText("tracking-stopped-count", stopped);
  setText("tracking-stale-count", stale);
  setText("tracking-map-device-count", `${total} thiết bị`);
}

function renderTrackingDeviceList() {
  const deviceList = document.getElementById("device-list");
  if (!deviceList) return;

  const devices = getFilteredTrackingDevices();
  setText("device-visible-count", devices.length);

  if (!devices.length) {
    deviceList.innerHTML = `
      <li class="tracking-device-list__empty">
        ${!trackingLoaded ? "Đang tải thiết bị..." : !trackingDevices.length ? "Chưa có dữ liệu vị trí thiết bị." : "Không tìm thấy thiết bị phù hợp."}
      </li>
    `;
    return;
  }

  deviceList.innerHTML = devices
    .map((device) => renderTrackingDeviceCard(device))
    .join("");
}

function renderTrackingDeviceCard(device) {
  const activeClass =
    device.mobileId === trackingSelectedMobileId
      ? " tracking-device-card--active"
      : "";
  const alertClass =
    device.staleFix === true ? " tracking-device-card--stale" : "";
  const statusClass = device.status === "moving" ? " tracking-device-card__status--moving" : "";

  return `
    <li>
      <button class="tracking-device-card${activeClass}${alertClass}" type="button" data-mobile-id="${escapeHtml(device.mobileId)}">
        <div class="tracking-device-card__header">
          <div class="tracking-device-card__identity">
            <span class="tracking-status-dot tracking-status-dot--${device.status}"></span>
            <strong>${escapeHtml(device.mobileId)}</strong>
          </div>
          <svg class="tracking-device-card__arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6L15 12L9 18"></path>
          </svg>
        </div>
        <div class="tracking-device-card__status ${statusClass}">
          ${device.statusText}${device.staleFix === true ? " · GPS cũ" : ""}
        </div>
        <div class="tracking-device-card__meta">
          <span>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7V12L15 14"></path>
            </svg>
            ${getTimeFromDateText(device.updatedAt)}
          </span>
          <span>${device.speedKph} km/h</span>
        </div>
        <div class="tracking-device-card__location">${escapeHtml(device.address)}</div>
        <div class="tracking-device-card__updated">${escapeHtml(device.updatedText)}</div>
      </button>
    </li>
  `;
}

function getFilteredTrackingDevices() {
  const keyword = trackingSearchKeyword.trim().toLowerCase();

  return trackingDevices.filter((device) => {
    const matchesFilter =
      trackingCurrentFilter === "all" ||
      (trackingCurrentFilter === "stale" ? device.staleFix === true : device.status === trackingCurrentFilter);
    const matchesSearch =
      !keyword ||
      device.mobileId.toLowerCase().includes(keyword) ||
      device.address.toLowerCase().includes(keyword);

    return matchesFilter && matchesSearch;
  });
}

export function openTrackingDevicePanel(mobileId) {
  const device = getTrackingDevice(mobileId);
  const trackingPage = document.querySelector(".tracking-page");
  if (!device || !trackingPage) return;

  trackingSelectedMobileId = mobileId;
  renderTrackingDeviceList();
  renderTrackingDeviceDetail(device);
  trackingPage.classList.add("tracking-page--detail-open");
  document.getElementById("tracking-device-panel").inert = false;

  window.dispatchEvent(
    new CustomEvent("tracking:device-selected", {
      detail: {
        mobileId: device.mobileId,
        latitude: device.latitude,
        longitude: device.longitude,
      },
    }),
  );

  notifyTrackingMapResize();
}

function closeTrackingDevicePanel() {
  const trackingPage = document.querySelector(".tracking-page");
  if (!trackingPage) return;

  trackingSelectedMobileId = null;
  trackingPage.classList.remove("tracking-page--detail-open");
  document.getElementById("tracking-device-panel").inert = true;
  renderTrackingDeviceList();

  window.dispatchEvent(new CustomEvent("tracking:device-unselected"));
  notifyTrackingMapResize();
}

function renderTrackingDeviceDetail(device) {
  setText("tracking-detail-mobile-id", device.mobileId);
  setText("tracking-detail-state-text", device.statusText);
  setText("tracking-detail-updated", device.updatedText);
  setText("tracking-detail-address", device.address);
  setText("tracking-detail-latitude", device.latitude?.toFixed(6) ?? "—");
  setText("tracking-detail-longitude", device.longitude?.toFixed(6) ?? "—");
  setText("tracking-detail-speed", device.speedKph);
  setText("tracking-detail-heading", device.headingText);
  setText("tracking-detail-motion", device.motionText);
  setText("tracking-detail-battery", device.batteryV?.toFixed(2) ?? "—");
  setText("tracking-message-mobile-id", device.mobileId);
  setText("tracking-message-log-id", device.logId);
  setText("tracking-message-type", device.messageType);
  setText("tracking-message-time", device.messageTime);
  setText("tracking-report-time", device.reportTime);
  setText("tracking-message-updated", device.updatedAt);
  setText("tracking-message-badge", device.messageType);
  setText("tracking-detail-footer-time", getTimeFromDateText(device.updatedAt));

  updateTrackingDeviceState(device.status);
  renderTrackingAlert(device);
  setText("tracking-report-source", device.reportSourceName || "—");
  const temperature = numberOrNull(device.internalTemperatureC);
  setText("tracking-temperature", temperature === null ? "—" : `${temperature} °C`);
  document.getElementById("tracking-detail-locate").disabled = !device.hasPosition;
  document.getElementById("tracking-copy-coordinate").disabled = !device.hasPosition;
}

function updateTrackingDeviceState(status) {
  const state = document.getElementById("tracking-detail-state");
  const dot = document.getElementById("tracking-detail-state-dot");
  if (!state || !dot) return;

  state.classList.remove(
    "tracking-device-state--moving",
    "tracking-device-state--stopped",
    "tracking-device-state--unknown",
  );

  dot.classList.remove(
    "tracking-status-dot--moving",
    "tracking-status-dot--stopped",
    "tracking-status-dot--unknown",
  );

  state.classList.add(`tracking-device-state--${status}`);
  dot.classList.add(`tracking-status-dot--${status}`);
}

function renderTrackingAlert(device) {
  const badge = document.getElementById("tracking-alert-badge");
  badge.textContent = device.staleFix === true ? "GPS cũ" : device.staleFix === false ? "GPS mới" : "Không xác định";
  badge.classList.toggle("tracking-alert-badge--normal", device.staleFix === false);
  badge.classList.toggle("tracking-alert-badge--stale", device.staleFix === true);
  setText("tracking-alert-content", device.staleFix === true
    ? "Bản tin sử dụng vị trí GPS cũ, có thể không phản ánh vị trí hiện tại."
    : device.staleFix === false ? "Bản tin sử dụng vị trí GPS mới." : "Chưa có thông tin về độ mới của vị trí GPS.");
}

function bindTrackingUiEvents() {
  const deviceList = document.getElementById("device-list");
  const searchInput = document.getElementById("tracking-device-search");
  const filters = document.querySelector(".tracking-sidebar__filters");
  const closeButton = document.getElementById("tracking-detail-close");
  const locateButton = document.getElementById("tracking-detail-locate");
  const copyButton = document.getElementById("tracking-copy-coordinate");
  const fitAllButton = document.getElementById("fit-all-devices");
  const mapFitAllButton = document.getElementById("tracking-map-fit-all");
  const mapFocusButton = document.getElementById("tracking-map-focus-selected");
  const fullscreenButton = document.getElementById("tracking-map-fullscreen");


  deviceList?.addEventListener("click", (event) => {
    const card = event.target.closest(".tracking-device-card");
    if (!card) return;

    openTrackingDevicePanel(card.dataset.mobileId);
  });

  searchInput?.addEventListener("input", (event) => {
    trackingSearchKeyword = event.target.value;
    renderTrackingDeviceList();
  });

  filters?.addEventListener("click", (event) => {
    const button = event.target.closest(".tracking-sidebar__filter");
    if (!button) return;

    trackingCurrentFilter = button.dataset.filter;

    document.querySelectorAll(".tracking-sidebar__filter").forEach((filter) => {
      filter.classList.toggle(
        "tracking-sidebar__filter--active",
        filter === button,
      );
    });

    renderTrackingDeviceList();
  });

  closeButton?.addEventListener("click", closeTrackingDevicePanel);

  locateButton?.addEventListener("click", () => {
    focusSelectedTrackingDevice();
  });

  mapFocusButton?.addEventListener("click", () => {
    focusSelectedTrackingDevice();
  });

  copyButton?.addEventListener("click", () => {
    copySelectedDeviceCoordinate();
  });

  fitAllButton?.addEventListener("click", () => {
    requestFitAllTrackingDevices();
  });

  mapFitAllButton?.addEventListener("click", () => {
    requestFitAllTrackingDevices();
  });

  fullscreenButton?.addEventListener("click", () => {
    toggleTrackingFullscreen();
  });

}

function focusSelectedTrackingDevice() {
  const device = getTrackingDevice(trackingSelectedMobileId);
  if (!device?.hasPosition) return;

  window.dispatchEvent(
    new CustomEvent("tracking:focus-device", {
      detail: {
        mobileId: device.mobileId,
        latitude: device.latitude,
        longitude: device.longitude,
      },
    }),
  );
}

function requestFitAllTrackingDevices() {
  window.dispatchEvent(
    new CustomEvent("tracking:fit-all", {
      detail: {
        devices: trackingDevices.map((device) => ({
          mobileId: device.mobileId,
          latitude: device.latitude,
          longitude: device.longitude,
        })),
      },
    }),
  );
}

async function copySelectedDeviceCoordinate() {
  const device = getTrackingDevice(trackingSelectedMobileId);
  if (!device?.hasPosition) return;

  const coordinate = `${device.latitude?.toFixed(6) ?? "—"}, ${device.longitude?.toFixed(6) ?? "—"}`;

  try {
    await navigator.clipboard.writeText(coordinate);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = coordinate;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

async function toggleTrackingFullscreen() {
  const mapArea = document.querySelector(".tracking-map-area");
  if (!mapArea) return;

  try {
    if (!document.fullscreenElement) {
      await mapArea.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }

    notifyTrackingMapResize();
  } catch {
    return;
  }
}

function getTrackingDevice(mobileId) {
  if (!mobileId) return null;
  return (
    trackingDevices.find((device) => device.mobileId === mobileId) ?? null
  );
}

function getTimeFromDateText(value) {
  if (!value) return "--";

  const match = value.match(/\b\d{2}:\d{2}:\d{2}\b/);
  return match?.[0] ?? value;
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
