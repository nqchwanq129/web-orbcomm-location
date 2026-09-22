const GAP_MS = 30 * 60 * 1000;
const STOP_MS = 10 * 60 * 1000;
const STOP_RADIUS_KM = 0.15;

export function findStops(data) {
  // Chỉ tính là điểm dừng khi vị trí giữ gần nhau ít nhất mười phút.
  const result = [];
  let start = 0;
  for (let i = 1; i <= data.length; i++) {
    const continues = i < data.length && Date.parse(data[i].messageUtc) - Date.parse(data[i - 1].messageUtc) <= GAP_MS
      && distanceKm(data[start], data[i]) <= STOP_RADIUS_KM;
    if (continues) continue;
    const end = i - 1;
    if (end > start && Date.parse(data[end].messageUtc) - Date.parse(data[start].messageUtc) >= STOP_MS) result.push({ start, end });
    start = i;
  }
  return result;
}

export function validPosition(item) {
  return item.latitude !== null && item.longitude !== null && item.latitude !== "" && item.longitude !== ""
    && Number.isFinite(Number(item.latitude)) && Math.abs(Number(item.latitude)) <= 90
    && Number.isFinite(Number(item.longitude)) && Math.abs(Number(item.longitude)) <= 180;
}

export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (Number(b.latitude) - Number(a.latitude)) * rad;
  const dLon = (Number(b.longitude) - Number(a.longitude)) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(Number(a.latitude) * rad) * Math.cos(Number(b.latitude) * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(x)));
}
