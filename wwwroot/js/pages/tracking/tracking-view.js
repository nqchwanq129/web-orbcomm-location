export function renderTrackingView() {
  const pageContent = document.getElementById("page-content");

  if (!pageContent) return false;

  pageContent.innerHTML = `
    <div class="tracking-page">
      ${renderTrackingSidebar()}
      ${renderTrackingMap()}
      ${renderTrackingDetailPanel()}
    </div>
  `;

  return true;
}

function renderTrackingSidebar() {
  return `
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
        ${renderSummaryItem("moving", "tracking-moving-count", "Di chuyển")}
        ${renderSummaryItem("stopped", "tracking-stopped-count", "Đứng yên")}
        ${renderSummaryItem("stale", "tracking-stale-count", "Vị trí cũ")}
      </div>

      <div class="tracking-sidebar__search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M20 20L16.65 16.65"></path>
        </svg>
        <input
          id="tracking-device-search"
          type="search"
          placeholder="Tìm thiết bị..."
          autocomplete="off"
        />
      </div>

      <div class="tracking-sidebar__filters">
        <button
          class="tracking-sidebar__filter tracking-sidebar__filter--active"
          type="button"
          data-filter="all"
        >
          Tất cả
        </button>

        <button
          class="tracking-sidebar__filter"
          type="button"
          data-filter="moving"
        >
          Di chuyển
        </button>

        <button
          class="tracking-sidebar__filter"
          type="button"
          data-filter="stopped"
        >
          Đứng yên
        </button>

        <button
          class="tracking-sidebar__filter"
          type="button"
          data-filter="stale"
        >
          Vị trí cũ
        </button>
      </div>

      <div class="tracking-device-section">
        <div class="tracking-device-section__header">
          <span>Danh sách thiết bị</span>
          <span
            id="device-visible-count"
            class="tracking-device-section__count"
          >
            0
          </span>
        </div>

        <ul
          id="device-list"
          class="tracking-device-list"
        ></ul>
      </div>

      <div class="tracking-sidebar__footer">
        <div class="tracking-refresh-status" aria-label="Tự động cập nhật dữ liệu mỗi 15 giây">
          <span class="tracking-refresh-status__dot" aria-hidden="true"></span>
          <span>Tự động cập nhật sau <strong id="tracking-refresh-countdown">15 giây</strong></span>
        </div>

        <button
          id="fit-all-devices"
          class="tracking-fit-all"
          type="button"
        >
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
  `;
}

function renderSummaryItem(type, id, label) {
  return `
    <div class="tracking-summary__item"${type === "stale" ? ' title="Số thiết bị đang báo lại tọa độ từ lần định vị trước"' : ""}>
      <div class="tracking-summary__value">
        <span class="tracking-status-dot tracking-status-dot--${type}"></span>
        <strong id="${id}">0</strong>
      </div>
      <span>${label}</span>
    </div>
  `;
}

function renderTrackingMap() {
  return `
    <main class="tracking-map-area">
      <section
        id="map"
        class="tracking-map"
        aria-label="Bản đồ vị trí thiết bị"
      ></section>

      <div class="tracking-map-toolbar">
        <button
          id="tracking-map-fit-all"
          type="button"
          title="Hiển thị tất cả thiết bị"
        >
          <svg viewBox="0 0 24 24">
            <path d="M8 3H3V8"></path>
            <path d="M16 3H21V8"></path>
            <path d="M8 21H3V16"></path>
            <path d="M16 21H21V16"></path>
          </svg>
        </button>

        <button
          id="tracking-map-focus-selected"
          type="button"
          title="Thiết bị đang chọn"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"></circle>
            <circle cx="12" cy="12" r="8"></circle>
            <path d="M12 2V5"></path>
            <path d="M12 19V22"></path>
            <path d="M2 12H5"></path>
            <path d="M19 12H22"></path>
          </svg>
        </button>

        <button
          id="tracking-map-fullscreen"
          type="button"
          title="Toàn màn hình"
        >
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
        <span id="connection-status" role="status">
          Đang tải dữ liệu...
        </span>
        <strong id="tracking-map-device-count">
          0 thiết bị
        </strong>
      </div>

      <div class="tracking-map-legend">
        <div class="tracking-map-legend__header">
          Chú thích
        </div>

        <div class="tracking-map-legend__items">
          <div>
            <span class="tracking-status-dot tracking-status-dot--distress"></span>
            <span>Báo nguy</span>
          </div>

          <div>
            <span class="tracking-status-dot tracking-status-dot--door"></span>
            <span>Cửa mở</span>
          </div>

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
            <span>Vị trí cũ</span>
          </div>

          <div>
            <span class="tracking-status-dot tracking-status-dot--unknown"></span>
            <span>Không xác định</span>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderTrackingDetailPanel() {
  return `
    <aside
      id="tracking-device-panel"
      class="tracking-device-panel"
      inert
    >
      <div class="tracking-detail-header">
        <div class="tracking-detail-header__top">
          <div>
            <span class="tracking-detail-header__eyebrow">
              Chi tiết thiết bị
            </span>
            <h2 id="tracking-detail-mobile-id">--</h2>
          </div>

          <button
            id="tracking-detail-close"
            class="tracking-detail-close"
            type="button"
            title="Đóng"
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 6L18 18"></path>
              <path d="M18 6L6 18"></path>
            </svg>
          </button>
        </div>

        <div class="tracking-detail-header__status">
          <span
            id="tracking-detail-state"
            class="tracking-device-state"
          >
            <span
              id="tracking-detail-state-dot"
              class="tracking-status-dot"
            ></span>
            <span id="tracking-detail-state-text">--</span>
          </span>

          <span id="tracking-detail-sensor-alert" class="tracking-detail-sensor-alert" hidden></span>

          <span id="tracking-detail-updated">--</span>
        </div>
      </div>

      <div class="tracking-detail-content">
        ${renderTrackingLocationSection()}
        ${renderTrackingStatusSection()}
        ${renderTrackingSensorSection()}
        ${renderTrackingCommandSection()}
        ${renderTrackingGpsSection()}
        ${renderTrackingMessageSection()}
      </div>

      <div class="tracking-detail-footer">
        <div>
          <span class="tracking-map-status__indicator"></span>
          <span id="tracking-detail-connection-status">
            Đang tải dữ liệu...
          </span>
        </div>
        <span id="tracking-detail-footer-time">--</span>
      </div>
    </aside>
  `;
}

function renderTrackingLocationSection() {
  return `
    <section class="tracking-detail-section">
      <div class="tracking-detail-section__heading">
        <div>
          <span class="tracking-detail-section__eyebrow">
            Vị trí hiện tại
          </span>
          <h3 id="tracking-detail-address">--</h3>
        </div>

        <button
          id="tracking-detail-locate"
          class="tracking-detail-location-button"
          type="button"
          title="Định vị trên bản đồ"
        >
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

        <button
          id="tracking-copy-coordinate"
          type="button"
          title="Sao chép tọa độ"
        >
          <svg viewBox="0 0 24 24">
            <rect
              x="8"
              y="8"
              width="11"
              height="11"
              rx="2"
            ></rect>
            <path d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8"></path>
          </svg>
        </button>
      </div>
    </section>
  `;
}

function renderTrackingStatusSection() {
  return `
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
            <strong>
              <span id="tracking-detail-speed">--</span>
              <small>km/h</small>
            </strong>
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
            <strong>
              <span id="tracking-detail-battery">--</span>
              <small>V</small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTrackingSensorSection() {
  return `
    <section class="tracking-detail-section">
      <div class="tracking-detail-section__title">
        <h3>Cảm biến</h3>
      </div>

      <dl class="tracking-detail-info">
        <div>
          <dt>Cảm biến cửa</dt>
          <dd id="tracking-detail-door">
            Chưa có dữ liệu
          </dd>
        </div>

        <div>
          <dt>Nút báo nguy</dt>
          <dd id="tracking-detail-distress">
            Chưa có dữ liệu
          </dd>
        </div>
      </dl>
    </section>
  `;
}

function renderTrackingCommandSection() {
  return `
    <section class="tracking-detail-section tracking-command-section">
      <div class="tracking-detail-section__title">
        <div>
          <span class="tracking-detail-section__eyebrow">
            Điều khiển
          </span>
          <h3>Gửi lệnh thiết bị</h3>
        </div>

        <span
          id="tracking-command-mobile-id"
          class="tracking-command-device"
        >
          --
        </span>
      </div>

      <div class="tracking-command-form">
        <div class="tracking-command-field">
          <label for="tracking-command-type">
            Loại lệnh
          </label>

          <select
            id="tracking-command-type"
            autocomplete="off"
          ></select>
        </div>

        <div
          id="tracking-command-parameter-group"
          class="tracking-command-field"
        >
          <label
            id="tracking-command-parameter-label"
            for="tracking-command-parameter"
          >
            Giá trị
          </label>

          <select
            id="tracking-command-parameter"
            autocomplete="off"
          ></select>
        </div>

        <button
          id="tracking-command-submit"
          class="tracking-command-submit"
          type="button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
          </svg>
          <span>Gửi lệnh</span>
        </button>
        <div id="tracking-command-result" role="status" aria-live="polite"></div>
      </div>

      <div class="tracking-command-history">
        <div class="tracking-command-history__header">
          <div>
            <span class="tracking-command-history__eyebrow">
              Nhật ký
            </span>
            <h4>Lịch sử lệnh</h4>
          </div>
        </div>

        <div id="tracking-command-rate-limit" class="tracking-command-history__warning" role="status" hidden></div>

        <div
          id="tracking-command-history-list"
          class="tracking-command-history__list"
        >
          <div class="tracking-command-history__empty">
            Chưa có lịch sử lệnh.
          </div>
        </div>

        <button
          id="tracking-command-history-more"
          class="tracking-command-history__more"
          type="button"
          hidden
        >
          Xem tất cả
        </button>
      </div>
    </section>
  `;
}

function renderTrackingGpsSection() {
  return `
    <section class="tracking-detail-section">
      <div class="tracking-detail-section__title">
        <h3>Chất lượng vị trí GPS</h3>
        <span
          id="tracking-alert-badge"
          class="tracking-alert-badge"
        >
          --
        </span>
      </div>

      <div id="tracking-alert-content"></div>
    </section>
  `;
}

function renderTrackingMessageSection() {
  return `
    <section class="tracking-detail-section">
      <div class="tracking-detail-section__title">
        <h3>Bản tin gần nhất</h3>
        <span
          id="tracking-message-badge"
          class="tracking-message-badge"
        >
          --
        </span>
      </div>

      <dl class="tracking-detail-info">
        <div>
          <dt>Nguồn báo cáo</dt>
          <dd id="tracking-report-source">—</dd>
        </div>

        <div>
          <dt>Nhiệt độ</dt>
          <dd id="tracking-temperature">—</dd>
        </div>

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
  `;
}
