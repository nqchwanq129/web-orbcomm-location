// Tọa độ chỉ dùng để đặt nhãn gần trung tâm mỗi quần đảo, không biểu thị ranh giới.
const islands = [
  { name: "Quần đảo Hoàng Sa", coordinates: [112.0, 16.5] },
  { name: "Quần đảo Trường Sa", coordinates: [114.4, 9.4] },
];

export function addIslandLabels(map) {
  for (const island of islands) {
    const label = document.createElement("span");
    label.className = "island-label";
    label.textContent = island.name;
    label.setAttribute("aria-label", island.name);

    new window.maplibregl.Marker({ element: label, anchor: "center" })
      .setLngLat(island.coordinates)
      .addTo(map);
  }
}
