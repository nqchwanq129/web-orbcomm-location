// wwwroot/js/popup.js
export function formatDate(utcDate) {
  if (!utcDate) {
    return "Chưa có";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(utcDate));
}
export function popupContent(device) {
  const motion =
    device.motionState === null
      ? "Không rõ"
      : device.motionState
        ? "Đang di chuyển"
        : "Đứng yên";
  return `
    <h3 class="popup-title">
      ${device.mobileId}
    </h3>
    <dl class="popup-grid">
      <dt>Trạng thái</dt>
      <dd>${motion}</dd>
      <dt>Tốc độ</dt>
      <dd>${device.speedKmh ?? 0} km/h</dd>
      <dt>Pin</dt>
      <dd>${device.batteryVoltage ?? "—"} V</dd>
      <dt>Nhiệt độ</dt>
      <dd>${device.internalTemperatureC ?? "—"} °C</dd>
      <dt>Cập nhật</dt>
      <dd>${formatDate(device.updatedAt)}</dd>
    </dl>
  `;
}
