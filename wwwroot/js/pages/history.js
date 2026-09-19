// wwwroot/js/pages/history.js

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
              —
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
                  Pin
                </th>

                <th>
                  Nhiệt độ
                </th>

                <th>
                  Stale fix
                </th>

                <th>
                  Thao tác
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
              type="button"
              aria-label="Trang trước">
              ‹
            </button>

            <span id="history-page-info">
              1 / 1
            </span>

            <button
              id="history-next"
              type="button"
              aria-label="Trang sau">
              ›
            </button>

          </div>

        </div>

      </div>

    </section>
  `;
}
