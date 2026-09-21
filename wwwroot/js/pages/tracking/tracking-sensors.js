import { parseReportTime } from "../devices/devices-formatters.js";

const sensorDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatTrackingSensor(value, batteryLevel, messageUtc, type) {
  if (value == null && !messageUtc) return "Chưa có dữ liệu";

  const labels = type === "Door"
    ? ["Đang đóng", "Đang mở"]
    : ["Đã huỷ/không báo nguy", "Đang báo nguy"];
  const status = value === 0 || value === 1 ? labels[value] : "Không xác định";
  const date = parseReportTime(messageUtc);
  const time = date ? sensorDateFormatter.format(date) : "Chưa có thời gian";
  const battery = typeof batteryLevel === "number" &&
    Number.isFinite(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100
    ? `${batteryLevel}%` : "chưa rõ";

  return `${status} (${time}, pin ${battery})`;
}
