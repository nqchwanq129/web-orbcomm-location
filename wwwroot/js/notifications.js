import { getDevices } from "./api.js";

const refreshMs = 30000;

export function initializeNotifications(username, onSelectDevice) {
  const button = document.querySelector(".topbar__notification-button");
  const panel = document.getElementById("notification-panel");
  const list = panel.querySelector(".topbar__notification-list");
  const badge = button.querySelector(".topbar__notification-badge");
  const readAll = panel.querySelector(".topbar__notification-read-all");
  const storageKey = `orbcomm-notifications-read:${username}`;
  let readIds;
  try {
    readIds = new Set(JSON.parse(sessionStorage.getItem(storageKey) || "[]"));
  } catch {
    readIds = new Set();
  }
  let notifications = [];
  let loading = false;

  function saveReadIds() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...readIds]));
    } catch { /* Trình duyệt có thể chặn bộ nhớ cục bộ. */ }
  }

  function close() {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function render() {
    const unread = notifications.filter((item) => !readIds.has(item.id)).length;
    badge.hidden = unread === 0;
    badge.textContent = unread > 99 ? "99+" : String(unread);
    button.setAttribute("aria-label", unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo");
    readAll.disabled = unread === 0;
    list.replaceChildren();

    if (!notifications.length) {
      const empty = document.createElement("p");
      empty.className = "topbar__notification-empty";
      empty.textContent = "Không có cảnh báo thiết bị.";
      list.append(empty);
      return;
    }

    for (const item of notifications) {
      const entry = document.createElement("button");
      entry.type = "button";
      entry.className = "topbar__notification-item";
      entry.classList.toggle("topbar__notification-item--unread", !readIds.has(item.id));
      const title = document.createElement("strong");
      title.textContent = item.title;
      const detail = document.createElement("span");
      detail.textContent = item.detail;
      entry.append(title, detail);
      entry.addEventListener("click", () => {
        readIds.add(item.id);
        saveReadIds();
        render();
        close();
        onSelectDevice(item.mobileId);
      });
      list.append(entry);
    }
  }

  async function refresh() {
    if (loading || document.hidden) return;
    loading = true;
    try {
      const devices = await getDevices();
      if (!Array.isArray(devices)) throw new Error("Invalid device data");
      notifications = devices.flatMap((device) => {
        if (!device?.mobileId) return [];
        const items = [];
        if (device.distressValue === 1) {
          items.push({
            id: `sos:${device.mobileId}:${device.distressMessageUtc || "active"}`,
            title: `SOS · ${device.mobileId}`,
            detail: "Thiết bị đang báo SOS. Bấm để xem vị trí.",
            mobileId: device.mobileId,
            time: device.distressMessageUtc,
          });
        }
        if (device.staleFix === true) {
          items.push({
            id: `stale:${device.mobileId}:${device.logId}`,
            title: `Vị trí cũ · ${device.mobileId}`,
            detail: "Thiết bị đang báo lại tọa độ từ lần định vị trước. Bấm để xem chi tiết.",
            mobileId: device.mobileId,
            time: device.messageUtc,
          });
        }
        return items;
      }).sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      const activeIds = new Set(notifications.map((item) => item.id));
      readIds = new Set([...readIds].filter((id) => activeIds.has(id)));
      saveReadIds();
      render();
    } catch {
      if (!notifications.length) {
        list.textContent = "Không tải được thông báo. Sẽ tự thử lại.";
      }
    } finally {
      loading = false;
    }
  }

  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "notification-panel");
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) refresh();
  });
  readAll.addEventListener("click", () => {
    notifications.forEach((item) => readIds.add(item.id));
    saveReadIds();
    render();
  });
  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && !button.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      close();
      button.focus();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
  render();
  refresh();
  setInterval(refresh, refreshMs);
}
