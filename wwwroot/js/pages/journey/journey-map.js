let map;
let marker;

export function renderJourneyMap(lines, points, onError) {
  if (!window.maplibregl) return onError("Không tải được thư viện bản đồ.", true);
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

export function clearJourneyMarker() {
  marker?.remove();
  marker = null;
}

export function destroyJourneyMap() {
  clearJourneyMarker();
  map?.remove();
  map = null;
}

export function focusJourneyPoint(point, fly = true) {
  if (!map) return;
  const position = [Number(point.longitude), Number(point.latitude)];
  if (!marker) marker = new window.maplibregl.Marker({ color: "#233767" }).setLngLat(position).addTo(map);
  else marker.setLngLat(position);
  if (fly) map.flyTo({ center: position, zoom: Math.max(map.getZoom(), 12) });
}
