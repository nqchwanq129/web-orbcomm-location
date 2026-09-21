import { getDevices, getDeviceHistory } from "../../api.js";

const GAP_MS = 30 * 60 * 1000;
const STOP_MS = 10 * 60 * 1000;
const STOP_RADIUS_KM = 0.15;
const formatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
let map;
let marker;
let request;
let points = [];
let selected = -1;
let stops = [];

export function renderJourneyPage() {
  document.getElementById("page-content").innerHTML = `
    <section class="journey-page">
      <header class="journey-header">
        <div><span class="journey-eyebrow">TRA CỨU VỊ TRÍ</span><h1>Theo dõi lịch sử hành trình</h1>
          <p>Xem các vị trí đã ghi nhận theo thời gian. Đường nối chỉ thể hiện thứ tự bản tin, không phải tuyến đường thực tế.</p></div>
      </header>
      <div class="journey-filters">
        <label>Thiết bị <select id="journey-device"><option value="">Chọn thiết bị</option></select></label>
        <div class="journey-presets" role="group" aria-label="Khoảng thời gian nhanh">
          <button type="button" data-hours="1">1 giờ</button><button type="button" data-hours="6">6 giờ</button>
          <button type="button" data-hours="24" class="is-active">24 giờ</button><button type="button" data-hours="168">7 ngày</button>
        </div>
        <label>Từ <input id="journey-from" type="datetime-local"></label>
        <label>Đến <input id="journey-to" type="datetime-local"></label>
        <button id="journey-search" type="button">Xem hành trình</button>
      </div>
      <p id="journey-status" class="journey-status" role="status">Chọn thiết bị để xem hành trình.</p>
      <div class="journey-summary" hidden>
        <div><span>Vị trí hợp lệ</span><strong id="journey-count">0</strong></div>
        <div><span>Điểm dừng ước tính</span><strong id="journey-stops">0</strong></div>
        <div><span>Khoảng mất dữ liệu</span><strong id="journey-gaps">0</strong></div>
        <div><span>Quãng đường nối điểm</span><strong id="journey-distance">0 km</strong></div>
      </div>
      <div class="journey-layout">
        <div class="journey-map-card"><div id="journey-map" aria-label="Bản đồ hành trình"></div>
          <div class="journey-playback"><div id="journey-current">Chưa có vị trí</div>
            <input id="journey-slider" type="range" min="0" max="0" value="0" disabled aria-label="Chọn vị trí trên dòng thời gian">
            <div class="journey-playback__ends"><span id="journey-start">—</span><span id="journey-end">—</span></div>
          </div></div>
        <aside class="journey-timeline"><h2>Mốc hành trình</h2><p>Chọn mốc để xem trên bản đồ.</p><div id="journey-events" class="journey-events"></div></aside>
      </div>
    </section>`;
}

export async function initializeJourneyPage({ mobileId = "" } = {}) {
  setRange(24);
  const device = document.getElementById("journey-device");
  const search = document.getElementById("journey-search");
  document.querySelectorAll(".journey-presets button").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".journey-presets button").forEach(item => item.classList.toggle("is-active", item === button));
    setRange(Number(button.dataset.hours));
  }));
  for (const id of ["journey-from", "journey-to"]) document.getElementById(id).addEventListener("change", () => {
    document.querySelectorAll(".journey-presets button").forEach(button => button.classList.remove("is-active"));
  });
  search.addEventListener("click", loadJourney);
  document.getElementById("journey-slider").addEventListener("input", event => selectPoint(Number(event.target.value)));
  try {
    const devices = await getDevices();
    if (!device.isConnected) return;
    for (const id of [...new Set(devices.map(item => item.mobileId).filter(Boolean))].sort()) {
      const option = new Option(id, id);
      device.add(option);
    }
    if (mobileId) device.value = mobileId;
    if (device.value) await loadJourney();
  } catch (error) {
    if (device.isConnected) setStatus(`Không tải được danh sách thiết bị: ${error.message}`, true);
  }
}

export function destroyJourneyPage() {
  request?.abort();
  request = null;
  marker?.remove();
  marker = null;
  map?.remove();
  map = null;
  points = [];
  stops = [];
  selected = -1;
}

async function loadJourney() {
  const mobileId = document.getElementById("journey-device").value;
  const from = document.getElementById("journey-from").value;
  const to = document.getElementById("journey-to").value;
  const start = new Date(from);
  const end = new Date(to);
  if (!mobileId) return setStatus("Hãy chọn một thiết bị.", true);
  if (!from || !to || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end || end - start > 7 * 86400000) {
    return setStatus("Chọn khoảng thời gian hợp lệ, tối đa 7 ngày.", true);
  }
  request?.abort();
  const active = new AbortController();
  request = active;
  const button = document.getElementById("journey-search");
  button.disabled = true;
  setStatus("Đang tải hành trình...");
  try {
    const data = await getDeviceHistory({ mobileId, from: start.toISOString(), to: end.toISOString(), signal: active.signal });
    if (request !== active || !button.isConnected) return;
    points = data.filter(item => validPosition(item) && item.staleFix !== true && Number.isFinite(Date.parse(item.messageUtc)))
      .sort((a, b) => Date.parse(a.messageUtc) - Date.parse(b.messageUtc) || a.logId - b.logId);
    stops = findStops(points);
    renderJourney(data.length);
  } catch (error) {
    if (error.name !== "AbortError" && button.isConnected) setStatus(`Không tải được hành trình: ${error.message}`, true);
  } finally {
    if (request === active) { request = null; if (button.isConnected) button.disabled = false; }
  }
}

function renderJourney(total) {
  marker?.remove();
  marker = null;
  const gaps = [];
  const lines = [];
  let segment = [];
  let distance = 0;
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (previous && Date.parse(point.messageUtc) - Date.parse(previous.messageUtc) > GAP_MS) {
      gaps.push(index);
      if (segment.length > 1) lines.push(segment);
      segment = [];
    } else if (previous) distance += distanceKm(previous, point);
    segment.push([Number(point.longitude), Number(point.latitude)]);
  });
  if (segment.length > 1) lines.push(segment);
  document.querySelector(".journey-summary").hidden = false;
  document.getElementById("journey-count").textContent = String(points.length);
  document.getElementById("journey-stops").textContent = String(stops.length);
  document.getElementById("journey-gaps").textContent = String(gaps.length);
  document.getElementById("journey-distance").textContent = `${distance.toFixed(1)} km`;
  const excluded = total - points.length;
  setStatus(points.length ? `${total} bản tin; ${excluded} bản tin không có vị trí tin cậy đã được bỏ qua.` : "Không có vị trí tin cậy trong khoảng thời gian này.");
  renderMap(lines);
  renderEvents(gaps);
  const slider = document.getElementById("journey-slider");
  slider.disabled = !points.length;
  slider.max = String(Math.max(0, points.length - 1));
  document.getElementById("journey-start").textContent = points.length ? formatTime(points[0].messageUtc) : "—";
  document.getElementById("journey-end").textContent = points.length ? formatTime(points.at(-1).messageUtc) : "—";
  if (points.length) selectPoint(points.length - 1, false);
  else document.getElementById("journey-current").textContent = "Chưa có vị trí";
}

function renderMap(lines) {
  if (!window.maplibregl) return setStatus("Không tải được thư viện bản đồ.", true);
  if (!map) {
    map = new window.maplibregl.Map({ container: "journey-map", style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm" }] }, center: [108.2, 16.1], zoom: 5 });
    map.addControl(new window.maplibregl.NavigationControl(), "top-right");
  }
  const currentMap = map;
  const update = () => {
    if (map !== currentMap) return;
    const geojson = { type: "FeatureCollection", features: lines.map(coordinates => ({ type: "Feature", geometry: { type: "LineString", coordinates }, properties: {} })) };
    if (currentMap.getSource("journey-route")) currentMap.getSource("journey-route").setData(geojson);
    else {
      currentMap.addSource("journey-route", { type: "geojson", data: geojson });
      currentMap.addLayer({ id: "journey-route-line", type: "line", source: "journey-route", paint: { "line-color": "#ea8b24", "line-width": 4, "line-opacity": 0.9 } });
    }
    if (points.length === 1) currentMap.flyTo({ center: [Number(points[0].longitude), Number(points[0].latitude)], zoom: 12 });
    if (points.length > 1) {
      const bounds = new window.maplibregl.LngLatBounds();
      points.forEach(point => bounds.extend([Number(point.longitude), Number(point.latitude)]));
      currentMap.fitBounds(bounds, { padding: 55, maxZoom: 14, duration: 0 });
    }
  };
  if (currentMap.isStyleLoaded()) update(); else currentMap.once("load", update);
}

function renderEvents(gaps) {
  const container = document.getElementById("journey-events");
  container.replaceChildren();
  if (!points.length) { container.textContent = "Không có mốc để hiển thị."; return; }
  const events = [{ index: 0, kind: "Bắt đầu" }, ...stops.map(stop => ({ index: stop.start, kind: "Dừng", end: stop.end }))];
  gaps.forEach(index => events.push({ index, kind: "Sau khoảng mất dữ liệu" }));
  events.push({ index: points.length - 1, kind: "Cuối cùng" });
  events.sort((a, b) => a.index - b.index);
  for (const event of events) {
    const point = points[event.index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journey-event";
    button.dataset.index = String(event.index);
    const title = document.createElement("strong");
    title.textContent = `${event.kind} · ${formatTime(point.messageUtc)}`;
    const detail = document.createElement("span");
    detail.textContent = event.end !== undefined
      ? `Đến ${formatTime(points[event.end].messageUtc)} · ${coordinate(point)}`
      : coordinate(point);
    button.append(title, detail);
    button.addEventListener("click", () => selectPoint(event.index));
    container.append(button);
  }
}

function selectPoint(index, fly = true) {
  if (!points[index]) return;
  selected = index;
  const point = points[index];
  document.getElementById("journey-slider").value = String(index);
  document.getElementById("journey-current").textContent = `${formatTime(point.messageUtc)} · ${coordinate(point)}${point.speedKmh == null ? "" : ` · ${Number(point.speedKmh).toFixed(1)} km/h`}`;
  document.querySelectorAll(".journey-event").forEach(item => item.classList.toggle("is-selected", Number(item.dataset.index) === index));
  if (map) {
    const position = [Number(point.longitude), Number(point.latitude)];
    if (!marker) marker = new window.maplibregl.Marker({ color: "#233767" }).setLngLat(position).addTo(map);
    else marker.setLngLat(position);
    if (fly) map.flyTo({ center: position, zoom: Math.max(map.getZoom(), 12) });
  }
}

function findStops(data) {
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

function validPosition(item) {
  return item.latitude !== null && item.longitude !== null && item.latitude !== "" && item.longitude !== ""
    && Number.isFinite(Number(item.latitude)) && Math.abs(Number(item.latitude)) <= 90
    && Number.isFinite(Number(item.longitude)) && Math.abs(Number(item.longitude)) <= 180;
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (Number(b.latitude) - Number(a.latitude)) * rad;
  const dLon = (Number(b.longitude) - Number(a.longitude)) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(Number(a.latitude) * rad) * Math.cos(Number(b.latitude) * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(x)));
}

function formatTime(value) { return formatter.format(new Date(value)); }
function coordinate(point) { return `${Number(point.latitude).toFixed(5)}, ${Number(point.longitude).toFixed(5)}`; }
function setStatus(message, error = false) {
  const element = document.getElementById("journey-status");
  if (element) { element.textContent = message; element.classList.toggle("is-error", error); }
}
function setRange(hours) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 3600000);
  const local = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById("journey-from").value = local(start);
  document.getElementById("journey-to").value = local(end);
}
