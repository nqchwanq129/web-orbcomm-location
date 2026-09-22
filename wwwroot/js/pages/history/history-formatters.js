// wwwroot/js/pages/history/history-formatters.js

export function formatCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "—";

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function formatSpeed(value) {
  const speed = Number(value);

  if (!Number.isFinite(speed)) return "—";

  return `${speed.toFixed(1)} km/h`;
}

export function formatHeading(value) {
  const heading = Number(value);

  if (!Number.isFinite(heading)) return "—";

  return `${heading.toFixed(0)}°`;
}

export function formatBattery(value) {
  const battery = Number(value);

  if (!Number.isFinite(battery)) return "—";

  return `${battery.toFixed(2)} V`;
}

export function formatTemperature(value) {
  const temperature = Number(value);

  if (!Number.isFinite(temperature)) return "—";

  return `${temperature.toFixed(1)} °C`;
}

export function formatDetailValue(value) {
  if (value === null || value === undefined || value === "") return "—";

  return String(value);
}

export function formatBoolean(value) {
  if (value === true) return "Có";
  if (value === false) return "Không";

  return "—";
}

export function formatSeconds(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) return "—";

  return `${seconds} giây`;
}

export function formatAcceleration(value) {
  const acceleration = Number(value);

  if (!Number.isFinite(acceleration)) return "—";

  return `${acceleration} mg`;
}

export function formatJson(value) {
  if (!value) return "";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function formatRange(from, to) {
  if (!from && !to) return "Tất cả thời gian";
  if (!from) return `Đến ${formatInputDate(to)}`;
  if (!to) return `Từ ${formatInputDate(from)}`;

  return `${formatInputDate(from)} → ${formatInputDate(to)}`;
}

export function formatInputDate(value) {
  const date = new Date(`${value}+07:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function vietnamInputToUtc(value) {
  if (!value) return "";
  const date = new Date(`${value}+07:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
