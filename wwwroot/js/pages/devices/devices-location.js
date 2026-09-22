const addressCache = new Map();

export async function loadDeviceAddress(elementId, latitude, longitude) {
  const element = document.getElementById(elementId);

  if (!element) return;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    element.textContent = "Không xác định được vị trí";
    return;
  }

  // Dùng cùng địa chỉ đã tra cho tọa độ lặp lại trong phiên mở trang.
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  if (addressCache.has(cacheKey)) {
    element.textContent = addressCache.get(cacheKey);
    return;
  }

  try {
    const address = await reverseGeocode(lat, lng);

    addressCache.set(cacheKey, address);

    if (element.isConnected) {
      element.textContent = address;
    }
  } catch (error) {
    console.error("Không lấy được địa chỉ:", error);

    if (element.isConnected) {
      element.textContent = "Không xác định được địa chỉ";
    }
  }
}

async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude,
    lon: longitude,
    "accept-language": "vi",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Geocoding trả về ${response.status}`);
  }

  const data = await response.json();

  return data.display_name || "Không xác định được địa chỉ";
}
