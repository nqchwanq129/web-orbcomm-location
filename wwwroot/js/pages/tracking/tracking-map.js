

let map;

const markers = new Map();

let hasFittedToDevices = false;

/* INITIALIZE MAP */
export function initializeMap() {
  if (map) {
    return map;
  }
  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    return null;
  }

  const maplibre = window.maplibregl;
  if (!maplibre) {
    throw new Error("Không tải được thư viện MapLibre từ CDN");
  }
  map = new maplibre.Map({
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
  map.addControl(new maplibre.NavigationControl(), "top-right");
  return map;
}

// Destroy map
export function destroyMap() {
  for (const marker of markers.values()) {
    marker.remove();
  }
  markers.clear();
  if (map) {
    map.remove();
    map = null;
  }
  hasFittedToDevices = false;
}

/* RENDER DEVICES */

export function renderDevices(devices) {
  if (!map) {
    initializeMap();
  }

  if (!map) {
    return;
  }

  const validDevices = devices.filter(device => device && typeof device.mobileId === "string" && device.mobileId
    && device.longitude !== null && device.longitude !== undefined && device.longitude !== ""
    && device.latitude !== null && device.latitude !== undefined && device.latitude !== ""
    && Number.isFinite(Number(device.longitude)) && Math.abs(Number(device.longitude)) <= 180
    && Number.isFinite(Number(device.latitude)) && Math.abs(Number(device.latitude)) <= 90);
  const currentIds = new Set(validDevices.map(device => device.mobileId));
  for (const [mobileId, marker] of markers) {
    if (!currentIds.has(mobileId)) {
      marker.remove();
      markers.delete(mobileId);
    }
  }
  for (const device of validDevices) {
    const position = [Number(device.longitude), Number(device.latitude)];
    let marker = markers.get(device.mobileId);
    if (!marker) {
      marker = new window.maplibregl.Marker().setLngLat(position).addTo(map);
      const element = marker.getElement();
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", `Chi tiết thiết bị ${device.mobileId}`);
      element.style.cursor = "pointer";
      const select = () => window.dispatchEvent(new CustomEvent("tracking:marker-selected", {
        detail: { mobileId: device.mobileId },
      }));
      element.addEventListener("click", select);
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
      markers.set(device.mobileId, marker);
    } else {
      marker.setLngLat(position);
    }
    const markerColors = {
      distress: "#dc3545", door: "#fd7e14", stale: "#f59e0b",
      moving: "#22c55e", stopped: "#94a3b8", unknown: "#667085",
    };
    const color = markerColors[device.markerState] ?? markerColors.unknown;
    marker.getElement().querySelector('svg g[fill]')?.setAttribute("fill", color);
    marker.getElement().setAttribute("aria-label",
      `Chi tiết thiết bị ${device.mobileId}${device.alertType === "distress" ? ", đang báo nguy" : device.alertType === "door" ? ", cửa mở" : ""}`);
  }
  if (!hasFittedToDevices && markers.size) {
    fitAllDevices();
    hasFittedToDevices = true;
  }
}

export function fitAllDevices() {
  if (!map || !markers.size) return;
  const bounds = new window.maplibregl.LngLatBounds();
  for (const marker of markers.values()) bounds.extend(marker.getLngLat());
  map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
}

export function resizeMap() {
  map?.resize();
}

/* FOCUS DEVICE */

export function focusDevice(mobileId) {
  if (!map) {
    return;
  }

  const marker = markers.get(mobileId);

  if (!marker) {
    return;
  }

  map.flyTo({
    center: marker.getLngLat(),

    zoom: 15,
  });


}
