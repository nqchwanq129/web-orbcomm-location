// wwwroot/js/topbar.js

export function renderTopbar() {
  const topbar = document.getElementById("topbar");

  topbar.className = "topbar";

  topbar.innerHTML = `
    <div class="topbar__brand">
      <div class="topbar__logo">
        <img
          src="/assets/logos/vishipel-logo.png"
          alt="Vishipel"
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
        data-page="journey">
        Hành trình
      </button>

      <button
        class="topbar__nav-item"
        type="button"
        data-page="devices">
        Danh sách
      </button>
      <button class="topbar__nav-item" type="button" data-page="history">
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
        class="topbar__icon-button topbar__notification-button"
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

        <span class="topbar__notification-badge" hidden></span>

      </button>


      <section id="notification-panel" class="topbar__notification-panel" aria-label="Thông báo" hidden>
        <div class="topbar__notification-heading">
          <strong>Thông báo</strong>
          <button class="topbar__notification-read-all" type="button">Đánh dấu đã đọc</button>
        </div>
        <div class="topbar__notification-list"></div>
      </section>

      <div class="topbar__account">
      <button
        class="topbar__profile"
        type="button"
        aria-label="Mở menu tài khoản"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="account-menu">

        <span class="topbar__avatar">
          A
        </span>

        <span class="topbar__profile-name">
          Tài khoản
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
      <div id="account-menu" class="topbar__account-menu" role="menu" hidden>
        <div class="topbar__account-label">Đang đăng nhập</div>
        <div class="topbar__account-username"></div>
        <div class="topbar__account-divider"></div>
        <button class="topbar__logout" type="button" role="menuitem">Đăng xuất</button>
      </div>
      </div>

    </div>
  `;
}
