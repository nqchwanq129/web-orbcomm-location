export const localDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("vi-VN", {
  numeric: "always",
});

export function parseReportTime(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const timestamp = value.trim();
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  const date = new Date(hasTimeZone ? timestamp : `${timestamp}Z`);

  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatUpdateTime(date) {
  const elapsedSeconds = (Date.now() - date.getTime()) / 1000;

  if (elapsedSeconds < 0 || elapsedSeconds >= 7 * 86400) {
    return localDateFormatter.format(date);
  }

  if (elapsedSeconds < 60) return "Vừa xong";

  for (const [unit, seconds] of [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]) {
    if (elapsedSeconds >= seconds) {
      return relativeTimeFormatter.format(
        -Math.floor(elapsedSeconds / seconds),
        unit,
      );
    }
  }

  return "Vừa xong";
}

export function getMotionText(value) {
  if (value === true) return "Đang di chuyển";
  if (value === false) return "Đứng yên";
  return "Không xác định";
}

export function getMotionClass(value) {
  if (value === true) return "device-detail__status--moving";
  if (value === false) return "device-detail__status--stopped";
  return "device-detail__status--unknown";
}

export function formatSpeed(value) {
  if (value === null || value === undefined || value === "") return "—";

  const speed = Number(value);
  return Number.isFinite(speed) ? `${speed.toFixed(1)} km/h` : "—";
}

export function formatHeading(value) {
  const heading = Number(value);
  return Number.isFinite(heading) ? `${heading.toFixed(0)}°` : "—";
}

export function formatBattery(value) {
  if (value === null || value === undefined || value === "") return "—";

  const battery = Number(value);

  if (!Number.isFinite(battery)) return "—";

  return `${battery.toFixed(2)} V`;
}

export function formatCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate.toFixed(6) : "—";
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
