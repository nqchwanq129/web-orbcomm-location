// wwwroot/js/pages/tracking/tracking-commands.js

const TRACKING_COMMANDS = {
  requestReport: {
    label: "Yêu cầu báo cáo",
    parameterLabel: "Giá trị báo cáo",
    options: [0, 1, 2, 3, 4, 5, 6, 7, 9],
  },
  getSensor: {
    label: "Đọc cảm biến",
    parameterLabel: "Chỉ số cảm biến",
    options: [0, 1, 2, 3],
  },
  resetDistressAlert: {
    label: "Xóa cảnh báo khẩn cấp",
    parameterLabel: null,
    options: [],
  },
  getConfigSummary: {
    label: "Lấy cấu hình",
    parameterLabel: null,
    options: [],
  },
  distressAlertAck: {
    label: "Xác nhận cảnh báo khẩn cấp",
    parameterLabel: null,
    options: [],
  },
};

let currentMobileId = null;
let historyRequestId = 0;
let visibleHistoryCount = 5;
let commandHistory = [];

// Hiển thị khu vực gửi lệnh
export function renderTrackingCommands(device) {
  const nextMobileId = device?.mobileId ?? null;
  if (currentMobileId !== nextMobileId) {
    const result = document.getElementById("tracking-command-result");
    if (result) result.textContent = "";
  }
  currentMobileId = nextMobileId;

  const mobileId = document.getElementById("tracking-command-mobile-id");

  if (mobileId) {
    mobileId.textContent = currentMobileId ?? "—";
  }

  renderTrackingCommandOptions();
  updateTrackingCommandParameter();
}

export async function loadTrackingCommandHistory(resetVisible = true) {
  const mobileId = currentMobileId;
  const requestId = ++historyRequestId;
  if (resetVisible) {
    visibleHistoryCount = 5;
    commandHistory = [];
    showHistoryMessage("Đang tải lịch sử lệnh...");
  }

  if (!mobileId) return;

  try {
    const response = await fetch(`/api/devices/${encodeURIComponent(mobileId)}/commands`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const commands = await response.json();
    if (requestId !== historyRequestId || mobileId !== currentMobileId) return;
    commandHistory = Array.isArray(commands) ? commands : [];
    renderTrackingCommandHistory();
  } catch (error) {
    if (requestId !== historyRequestId || mobileId !== currentMobileId) return;
    console.error("Không tải được lịch sử lệnh:", error);
    showHistoryMessage("Không tải được lịch sử lệnh.");
  }
}

export function showMoreTrackingCommandHistory() {
  visibleHistoryCount += 5;
  renderTrackingCommandHistory();
}

function showHistoryMessage(message) {
  const list = document.getElementById("tracking-command-history-list");
  const more = document.getElementById("tracking-command-history-more");
  if (list) {
    list.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "tracking-command-history__empty";
    empty.textContent = message;
    list.appendChild(empty);
  }
  if (more) more.hidden = true;
}

function renderTrackingCommandHistory() {
  const list = document.getElementById("tracking-command-history-list");
  const more = document.getElementById("tracking-command-history-more");
  if (!list) return;
  if (!commandHistory.length) {
    showHistoryMessage("Chưa có lịch sử lệnh.");
    return;
  }

  list.replaceChildren();
  for (const command of commandHistory.slice(0, visibleHistoryCount)) {
    const item = document.createElement("div");
    item.className = "tracking-command-history__item";
    const content = document.createElement("div");
    content.className = "tracking-command-history__content";
    const title = document.createElement("strong");
    title.className = "tracking-command-history__command";
    const type = TRACKING_COMMANDS[command.commandType];
    title.textContent = type ? `${type.label} (${command.commandType})` : (command.commandType || "Lệnh");
    const meta = document.createElement("div");
    meta.className = "tracking-command-history__meta";
    const value = command.reportValue ?? command.sensorIndex;
    const parts = [`#${command.commandId}`, formatCommandTime(command.createdAt)];
    if (value != null) parts.push(`${type?.parameterLabel || "Giá trị"}: ${value}`);
    meta.textContent = parts.join(" · ");
    content.append(title, meta);

    const status = document.createElement("span");
    const statusKey = String(command.status || "pending").toLowerCase();
    const statusLabels = {
      pending: "Đang chờ", sent: "Đã gửi", submitted: "Đã gửi",
      acknowledged: "Đã xác nhận", failed: "Thất bại",
      submitfailed: "Gửi thất bại",
      error: "Lỗi", timeout: "Quá thời gian", canceled: "Đã hủy",
    };
    const statusClass = ["pending", "sent", "acknowledged", "failed"].includes(statusKey)
      ? statusKey : statusKey === "submitted" ? "sent" : ["submitfailed", "error", "timeout", "canceled"].includes(statusKey) ? "failed" : "pending";
    status.className = `tracking-command-history__status tracking-command-history__status--${statusClass}`;
    status.textContent = statusLabels[statusKey] || command.status || "Không rõ";
    item.append(content, status);
    list.appendChild(item);
  }
  if (more) more.hidden = visibleHistoryCount >= commandHistory.length;
}

function formatCommandTime(value) {
  if (!value) return "--";
  const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(utcValue);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

// Hiển thị danh sách lệnh
function renderTrackingCommandOptions() {
  const select = document.getElementById("tracking-command-type");

  if (!select || select.options.length > 0) return;

  Object.entries(TRACKING_COMMANDS).forEach(([value, command]) => {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = `${command.label} (${value})`;

    select.appendChild(option);
  });

  select.addEventListener("change", updateTrackingCommandParameter);
}

// Cập nhật tham số theo loại lệnh
function updateTrackingCommandParameter() {
  const commandSelect = document.getElementById("tracking-command-type");
  const parameterGroup = document.getElementById(
    "tracking-command-parameter-group",
  );
  const parameterLabel = document.getElementById(
    "tracking-command-parameter-label",
  );
  const parameterSelect = document.getElementById("tracking-command-parameter");

  if (!commandSelect || !parameterGroup || !parameterLabel || !parameterSelect)
    return;

  const command = TRACKING_COMMANDS[commandSelect.value];

  parameterSelect.innerHTML = "";

  if (!command || command.options.length === 0) {
    parameterGroup.hidden = true;
    return;
  }

  parameterGroup.hidden = false;
  parameterLabel.textContent = command.parameterLabel;

  command.options.forEach((value) => {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = value;

    parameterSelect.appendChild(option);
  });
}

// Lấy dữ liệu lệnh hiện tại
export function getTrackingCommandPayload() {
  const commandSelect = document.getElementById("tracking-command-type");
  const parameterSelect = document.getElementById("tracking-command-parameter");

  if (!commandSelect || !currentMobileId) return null;

  const command = TRACKING_COMMANDS[commandSelect.value];

  if (!command) return null;

  return {
    mobileId: currentMobileId,
    command: commandSelect.value,
    value: command.options.length > 0 ? Number(parameterSelect?.value) : null,
  };
}
