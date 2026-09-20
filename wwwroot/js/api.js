export async function getDevices({ signal } = {}) {
  const response = await fetch("/api/devices", { signal });

  if (!response.ok) {
    throw new Error(`API trả về ${response.status}`);
  }

  return response.json();
}

export async function getDeviceHistory({ mobileId, from, to, messageType }) {
  const params = new URLSearchParams();

  if (mobileId) {
    params.set("mobileId", mobileId);
  }

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  if (messageType && messageType !== "all") {
    params.set("messageType", messageType);
  }

  const response = await fetch(`/api/devices/history?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API trả về ${response.status}`);
  }

  return response.json();
}

export async function getDeviceHistoryDetail(logId) {
  const response = await fetch(`/api/devices/history/${logId}`);

  if (!response.ok) {
    throw new Error(`API trả về ${response.status}`);
  }

  return response.json();
}
