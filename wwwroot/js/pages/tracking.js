export function renderTrackingPage() {
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <div class="tracking-page">

      <aside class="tracking-sidebar">

        <div class="tracking-sidebar__header">

          <div>

            <span class="tracking-sidebar__eyebrow">
              Theo dõi
            </span>

            <h2 class="tracking-sidebar__title">
              Thiết bị
            </h2>

          </div>

          <div class="tracking-sidebar__count">

            <strong id="device-count">
              0
            </strong>

            <span>
              thiết bị
            </span>

          </div>

        </div>


        <div class="tracking-sidebar__search">

          <svg
            class="tracking-sidebar__search-icon"
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
            data-filter="all">

            Tất cả

          </button>


          <button
            class="tracking-sidebar__filter"
            type="button"
            data-filter="moving">

            Di chuyển

          </button>


          <button
            class="tracking-sidebar__filter"
            type="button"
            data-filter="stopped">

            Đứng yên

          </button>

        </div>


        <div class="tracking-sidebar__list">

          <div class="tracking-sidebar__list-header">

            <span>
              Danh sách thiết bị
            </span>

            <span id="device-visible-count">
              0
            </span>

          </div>


          <ul
            id="device-list"
            class="device-list">
          </ul>

        </div>


        <div class="tracking-sidebar__tools">

          <label class="tracking-sidebar__option">

            <input
              id="auto-refresh"
              type="checkbox"
              checked
            />

            <span>
              Tự động cập nhật
            </span>

          </label>


          <button
            id="fit-all-devices"
            class="tracking-sidebar__fit-button"
            type="button">

            Hiển thị tất cả thiết bị

          </button>

        </div>

      </aside>


      <section
        id="map"
        class="tracking-map"
        aria-label="Bản đồ vị trí thiết bị">
      </section>

    </div>
  `;
}
