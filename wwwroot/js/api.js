export async function getDevices() {
  const response = await fetch("/api/devices");
  if (!response.ok) {
    throw new Error(`API trả về ${response.status}`);
  }
  return response.json();
}
