import { popupContent } from "./popup.js";

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

/* DESTROY MAP */

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

  const currentIds = new Set(devices.map((device) => device.mobileId));

  for (const [mobileId, marker] of markers) {
    if (!currentIds.has(mobileId)) {
      marker.remove();

      markers.delete(mobileId);
    }
  }

  for (const device of devices) {
    const longitude = Number(device.longitude);

    const latitude = Number(device.latitude);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      continue;
    }

    let marker = markers.get(device.mobileId);

    if (!marker) {
      const popup = new window.maplibregl.Popup({
        offset: 25,

        maxWidth: "320px",
      }).setHTML(popupContent(device));

      marker = new window.maplibregl.Marker()
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map);

      markers.set(device.mobileId, marker);
    } else {
      marker.setLngLat([longitude, latitude]);

      marker.getPopup().setHTML(popupContent(device));
    }
  }

  if (!hasFittedToDevices && devices.length > 0) {
    const bounds = new window.maplibregl.LngLatBounds();

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

  marker.togglePopup();
}
