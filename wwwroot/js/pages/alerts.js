export function renderAlertsPage() {
  const pageContent = document.getElementById("page-content");

  pageContent.innerHTML = `
    <section class="alerts-page">

      <h1>
        Cảnh báo
      </h1>

      <p>
        Nội dung cảnh báo sẽ được xây dựng tại đây.
      </p>

    </section>
  `;
}
