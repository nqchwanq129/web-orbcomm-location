//wwwroot/js/map.js
const map = new maplibregl.Map({
  container: "map",

  style: {
    version: 8,

    sources: {
      osm: {
        type: "raster",

        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],

        tileSize: 256,

        attribution: "© OpenStreetMap contributors",
      },
    },

    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  },

  center: [108.2, 16.1],

  zoom: 5,
});

// Navigation Control
map.addControl(new maplibregl.NavigationControl(), "top-right");

// Variables
const markers = new Map();
let hasFittedToDevices = false;
const statusElement = document.getElementById("connection-status");
const countElement = document.getElementById("device-count");
const deviceListElement = document.getElementById("device-list");

// Format date
function formatDate(utcDate) {
  if (!utcDate) {
    return "Chưa có";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(utcDate));
}

// Popup
function popupContent(device) {
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

// Device list
function renderDeviceList(devices) {
  deviceListElement.replaceChildren();
  for (const device of devices) {
    const button = document.createElement("button");
    button.innerHTML = `
            <strong>
                ${device.mobileId}
            </strong>
            <small>
                ${formatDate(device.updatedAt)}
            </small>
        `;
    button.addEventListener("click", () => {
      const marker = markers.get(device.mobileId);
      if (!marker) {
        return;
      }
      const position = marker.getLngLat();
      map.flyTo({
        center: position,
        zoom: 15,
      });
      marker.togglePopup();
    });
    const item = document.createElement("li");
    item.append(button);
    deviceListElement.append(item);
  }
}

// Render devices
function renderDevices(devices) {
  const currentIds = new Set(devices.map((device) => device.mobileId));
  // Xóa marker của thiết bị không còn tồn tại
  for (const [mobileId, marker] of markers) {
    if (!currentIds.has(mobileId)) {
      marker.remove();

      markers.delete(mobileId);
    }
  }
  // Tạo / update marker
  for (const device of devices) {
    const longitude = Number(device.longitude);
    const latitude = Number(device.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      continue;
    }
    let marker = markers.get(device.mobileId);
    if (!marker) {
      const popup = new maplibregl.Popup({
        offset: 25,
      }).setHTML(popupContent(device));
      marker = new maplibregl.Marker()
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map);
      markers.set(device.mobileId, marker);
    } else {
      marker.setLngLat([longitude, latitude]);
      marker.getPopup().setHTML(popupContent(device));
    }
  }
  renderDeviceList(devices);
  countElement.textContent = devices.length;

  // Zoom lần đầu vào toàn bộ thiết bị
  if (!hasFittedToDevices && devices.length > 0) {
    const bounds = new maplibregl.LngLatBounds();
    for (const device of devices) {
      const longitude = Number(device.longitude);
      const latitude = Number(device.latitude);
      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        bounds.extend([longitude, latitude]);
      }
    }
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
      });
    }
    hasFittedToDevices = true;
  }
}

// Load API
async function loadDevices() {
  try {
    const response = await fetch("/api/devices");
    if (!response.ok) {
      throw new Error(`API trả về ${response.status}`);
    }
    const devices = await response.json();
    renderDevices(devices);
    statusElement.textContent = `Đã cập nhật: ${new Date().toLocaleTimeString(
      "vi-VN",
    )}`;
    statusElement.classList.remove("error");
  } catch (error) {
    statusElement.textContent = `Không tải được dữ liệu: ${error.message}`;
    statusElement.classList.add("error");
  }
}

loadDevices();
// Update mỗi 15 giây
setInterval(loadDevices, 15000);
