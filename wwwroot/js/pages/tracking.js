export function renderTrackingPage() {
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <div class="tracking-page">

      <aside class="sidebar">

        <section class="device-summary">

          <strong id="device-count">
            0
          </strong>

          <span>
            thiết bị có vị trí
          </span>

        </section>


        <section>

          <h2>
            Thiết bị
          </h2>

          <ul
            id="device-list"
            class="device-list">
          </ul>

        </section>

      </aside>


      <section
        id="map"
        aria-label="Bản đồ vị trí thiết bị">
      </section>

    </div>
  `;
}
