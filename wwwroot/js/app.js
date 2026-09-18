import { renderTopbar } from "./topbar.js";
import { getDevices } from "./api.js";
import { initializeMap, renderDevices, focusDevice } from "./map.js";
import { formatDate } from "./popup.js";

renderTopbar();
const statusElement = document.getElementById("connection-status");
const countElement = document.getElementById("device-count");
const deviceListElement = document.getElementById("device-list");

try {
  initializeMap();
} catch (error) {
  statusElement.textContent = error.message;
  statusElement.classList.add("error");
}

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
      focusDevice(device.mobileId);
    });
    const item = document.createElement("li");
    item.append(button);
    deviceListElement.append(item);
  }
}

async function loadDevices() {
  try {
    const devices = await getDevices();
    renderDevices(devices);
    renderDeviceList(devices);
    countElement.textContent = devices.length;
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
setInterval(loadDevices, 15000);
