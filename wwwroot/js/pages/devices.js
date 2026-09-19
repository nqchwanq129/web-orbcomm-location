export function renderDevicesPage() {
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <section class="devices-page">

      <div class="devices-page__header">

        <div>

          <span class="devices-page__eyebrow">
            Thiết bị
          </span>

          <h1 class="devices-page__title">
            Danh sách thiết bị
          </h1>

          <p class="devices-page__subtitle">
            Theo dõi trạng thái và thông tin cập nhật của toàn bộ thiết bị.
          </p>

        </div>

      </div>


      <div class="devices-card">

        <div class="devices-toolbar">

          <div class="devices-search">

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

            <input
              id="devices-search"
              type="search"
              placeholder="Tìm theo mã thiết bị..."
              autocomplete="off"
            />

          </div>


          <select
            id="devices-status-filter"
            class="devices-filter">

            <option value="all">
              Tất cả trạng thái
            </option>

            <option value="moving">
              Đang di chuyển
            </option>

            <option value="stopped">
              Đứng yên
            </option>

            <option value="unknown">
              Không rõ
            </option>

          </select>

        </div>


        <div class="devices-table-wrapper">

          <table class="devices-table">

            <thead>

              <tr>

                <th>
                  Thiết bị
                </th>

                <th>
                  Trạng thái
                </th>

                <th>
                  Vị trí
                </th>

                <th>
                  Tốc độ
                </th>

                <th>
                  Pin
                </th>

                <th>
                  Nhiệt độ
                </th>

                <th>
                  Cập nhật
                </th>

              </tr>

            </thead>

            <tbody id="devices-table-body">

            </tbody>

          </table>

        </div>


        <div class="devices-footer">

          <span id="devices-result-count">
            0 thiết bị
          </span>

          <div class="devices-pagination">

            <button
              type="button"
              id="devices-prev">
              ‹
            </button>

            <span id="devices-page-info">
              1 / 1
            </span>

            <button
              type="button"
              id="devices-next">
              ›
            </button>

          </div>

        </div>

      </div>

    </section>
  `;
}
