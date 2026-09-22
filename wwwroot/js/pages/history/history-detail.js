import { getDeviceHistoryDetail } from "../../api.js";
import { formatDate } from "../../date-format.js";
import {
  escapeHtml,
  formatAcceleration,
  formatBattery,
  formatBoolean,
  formatDetailValue,
  formatHeading,
  formatJson,
  formatSeconds,
  formatSpeed,
  formatTemperature,
} from "./history-formatters.js";

export async function openHistoryDetail(logId) {
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
          <h2 id="history-detail-title">Chi tiết bản tin</h2>
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
      <summary>${escapeHtml(title)}</summary>
      <pre>${escapeHtml(formatJson(value))}</pre>
    </details>
  `;
}

function closeHistoryDetail() {
  const modal = document.getElementById("history-detail-modal");

  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("history-modal-open");
}
