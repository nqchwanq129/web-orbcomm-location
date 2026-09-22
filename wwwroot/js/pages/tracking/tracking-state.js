import {
  parseReportTime,
  localDateFormatter,
  formatUpdateTime,
  getMotionText,
} from "../devices/devices-formatters.js";

let trackingDevices = [];
let trackingLoaded = false;
let trackingSelectedMobileId = null;
let trackingCurrentFilter = "all";
let trackingSearchKeyword = "";

function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }

  return Number(value);
}

function formatTrackingDate(value) {
  const date = parseReportTime(value);
  return date ? localDateFormatter.format(date) : "—";
}

function normalizeTrackingDevice(device) {
  const latitude = numberOrNull(device.latitude);
  const longitude = numberOrNull(device.longitude);
  const heading = numberOrNull(device.headingDeg);
  const updated = parseReportTime(device.updatedAt);

  const hasPosition =
    latitude !== null &&
    longitude !== null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  const status =
    device.motionState === true
      ? "moving"
      : device.motionState === false
        ? "stopped"
        : "unknown";
  const alertType = device.distressValue === 1
    ? "distress"
    : device.doorValue === 1
      ? "door"
      : null;
  // Cảnh báo được ưu tiên hơn trạng thái GPS và chuyển động trên bản đồ.
  const markerState = alertType ?? (device.staleFix === true ? "stale" : status);

  return {
    ...device,
    latitude,
    longitude,
    hasPosition,
    status,
    alertType,
    markerState,
    statusText: getMotionText(device.motionState),
    updatedText: updated
      ? formatUpdateTime(updated)
      : "Chưa có thời gian cập nhật",
    updatedAt: formatTrackingDate(device.updatedAt),
    address: hasPosition
      ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : "Chưa có tọa độ hợp lệ",
    speedKph: numberOrNull(device.speedKmh) ?? "—",
    headingText: heading === null ? "Không xác định" : `${heading}°`,
    motionText: getMotionText(device.motionState),
    batteryV: numberOrNull(device.batteryVoltage),
    messageType: device.messageTypeName || "—",
    messageTime: formatTrackingDate(device.messageUtc),
    reportTime: formatTrackingDate(device.reportTimestampUtc),
  };
}

export function setTrackingDevices(devices) {
  trackingDevices = devices
    .filter(
      (device) =>
        device && typeof device.mobileId === "string" && device.mobileId,
    )
    .map(normalizeTrackingDevice);

  trackingLoaded = true;
}

export function resetTrackingState() {
  trackingDevices = [];
  trackingLoaded = false;
  trackingSelectedMobileId = null;
  trackingCurrentFilter = "all";
  trackingSearchKeyword = "";
}

export function getTrackingDevices() {
  return trackingDevices;
}

export function isTrackingLoaded() {
  return trackingLoaded;
}

export function getSelectedMobileId() {
  return trackingSelectedMobileId;
}

export function setSelectedMobileId(mobileId) {
  trackingSelectedMobileId = mobileId;
}

export function getTrackingDevice(mobileId) {
  if (!mobileId) return null;

  return trackingDevices.find((device) => device.mobileId === mobileId) ?? null;
}

export function setTrackingFilter(filter) {
  trackingCurrentFilter = filter;
}

export function setTrackingSearchKeyword(keyword) {
  trackingSearchKeyword = keyword;
}

export function getFilteredTrackingDevices() {
  const keyword = trackingSearchKeyword.trim().toLowerCase();

  return trackingDevices.filter((device) => {
    const matchesFilter =
      trackingCurrentFilter === "all" ||
      (trackingCurrentFilter === "stale"
        ? device.staleFix === true
        : device.status === trackingCurrentFilter);

    const matchesSearch =
      !keyword ||
      device.mobileId.toLowerCase().includes(keyword) ||
      device.address.toLowerCase().includes(keyword);

    return matchesFilter && matchesSearch;
  });
}

export function toNumberOrNull(value) {
  return numberOrNull(value);
}
