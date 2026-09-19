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

function getMotionLabel(motionState) {
  if (motionState === null) {
    return "Không rõ";
  }
  return motionState ? "Đang di chuyển" : "Đứng yên";
}

export function popupContent(device) {
  const motion = getMotionLabel(device.motionState);
  return `
    <div class="device-popup">
      <div class="device-popup__header">
        <div>
          <div class="device-popup__eyebrow">Thiết bị</div>
          <h3 class="device-popup__title">${device.mobileId}</h3>
        </div>
        <span class="device-popup__status">
          ${motion}
        </span>
      </div>

      <div class="device-popup__grid">
        <span class="device-popup__label">Tốc độ</span>
        <strong>${device.speedKmh ?? 0} km/h</strong>
        <span class="device-popup__label">Pin</span>
        <strong>${device.batteryVoltage ?? "—"} V</strong>
        <span class="device-popup__label">Nhiệt độ</span>
        <strong>${device.internalTemperatureC ?? "—"} °C</strong>
        <span class="device-popup__label">Cập nhật</span>
        <strong>${formatDate(device.updatedAt)}</strong>
      </div>
    </div>
  `;
}
