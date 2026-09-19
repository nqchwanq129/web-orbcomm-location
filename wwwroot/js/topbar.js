// wwwroot/js/topbar.js

export function renderTopbar() {
  const topbar = document.getElementById("topbar");

  topbar.className = "topbar";

  topbar.innerHTML = `
    <div class="topbar__brand">
      <div class="topbar__logo">
        <img
          src="/assets/logos/vishipel-logo.png"
          alt="ORBCOMM Logo"
        />
      </div>
      <div class="topbar__brand-text">
        <div class="topbar__title">
          ORBCOMM Tracking
        </div>
        <div class="topbar__subtitle">
          SC1000 Fleet Monitoring
        </div>
      </div>
    </div>


    <nav class="topbar__nav">
      <button
        class="topbar__nav-item topbar__nav-item--active"
        type="button"
        data-page="tracking">
        Theo dõi trực tiếp
      </button>

      <button
        class="topbar__nav-item"
        type="button"
        data-page="devices">
        Danh sách
      </button>

      <button
        class="topbar__nav-item"
        type="button"
        data-page="history">
        Lịch sử
      </button>
    </nav>


    <div class="topbar__actions">
      <div class="topbar__connection">
        <span class="topbar__connection-dot"></span>
        <span id="connection-status">
          Đang tải dữ liệu…
        </span>
      </div>


      <button
        class="topbar__icon-button"
        type="button"
        aria-label="Thông báo">

        <svg
          class="topbar__icon"
          viewBox="0 0 24 24"
          aria-hidden="true">

          <path
            d="M18 8A6 6 0 0 0 6 8
               C6 15 3 16 3 16
               H21
               C21 16 18 15 18 8">
          </path>

          <path
            d="M10 20H14">
          </path>

        </svg>

        <span class="topbar__notification-badge">
          3
        </span>

      </button>


      <button
        class="topbar__profile"
        type="button">

        <span class="topbar__avatar">
          A
        </span>

        <span class="topbar__profile-name">
          Admin
        </span>

        <svg
          class="topbar__chevron"
          viewBox="0 0 24 24"
          aria-hidden="true">

          <path
            d="M7 10L12 15L17 10">
          </path>

        </svg>

      </button>

    </div>
  `;
}
