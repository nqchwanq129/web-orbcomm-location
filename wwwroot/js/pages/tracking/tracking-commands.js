const TRACKING_COMMANDS = {
  requestReport: {
    label: "Yêu cầu báo cáo",
    parameterLabel: "Loại báo cáo cần nhận",
    options: [0, 1, 2, 3, 4, 5, 6, 7, 9],
    optionLabels: {
      0: "Vị trí cơ bản",
      1: "Vị trí, tốc độ và hướng",
      2: "Vị trí và giờ hoạt động",
      3: "Vị trí và một cảm biến",
      4: "Vị trí và nhiều cảm biến",
      5: "Vị trí, cảm biến và giờ hoạt động",
      6: "Chẩn đoán thiết bị",
      7: "Tình trạng tín hiệu bị che khuất",
      9: "Phát hiện va chạm",
    },
  },
  getSensor: {
    label: "Đọc cảm biến",
    parameterLabel: "Cảm biến cần đọc",
    options: [0, 1, 2, 3],
    optionLabels: {
      0: "Cảm biến số 0",
      1: "Cảm biến số 1",
      2: "Cảm biến số 2",
      3: "Cảm biến số 3",
    },
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

export function renderTrackingCommands(device) {
  const nextMobileId = device?.mobileId ?? null;
  if (currentMobileId !== nextMobileId) {
    const result = document.getElementById("tracking-command-result");
    if (result) result.textContent = "";
    const warning = document.getElementById("tracking-command-rate-limit");
    if (warning) warning.hidden = true;
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
  // Mỗi lần tải tăng mã yêu cầu để bỏ phản hồi đến muộn của thiết bị trước.
  const requestId = ++historyRequestId;
  if (resetVisible) {
    visibleHistoryCount = 5;
    commandHistory = [];
    showHistoryMessage("Đang tải lịch sử lệnh...");
  }

  if (!mobileId) return;

  try {
    const [response, healthResult] = await Promise.all([
      fetch(`/api/devices/${encodeURIComponent(mobileId)}/commands`),
      fetch("/api/devices/commands/status").then((result) =>
        result.ok ? result.json() : null,
      ).catch(() => null),
    ]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const commands = await response.json();
    if (requestId !== historyRequestId || mobileId !== currentMobileId) return;
    commandHistory = Array.isArray(commands) ? commands : [];
    renderCommandRateLimit(healthResult);
    renderTrackingCommandHistory();
  } catch (error) {
    if (requestId !== historyRequestId || mobileId !== currentMobileId) return;
    console.error("Không tải được lịch sử lệnh:", error);
    showHistoryMessage("Không tải được lịch sử lệnh.");
  }
}

function renderCommandRateLimit(health) {
  const warning = document.getElementById("tracking-command-rate-limit");
  if (!warning) return;
  const retryAt = health?.retryAtUtc ? new Date(health.retryAtUtc) : null;
  const hasPending = commandHistory.some((command) => command.status === "Submitted");
  const limited = hasPending && retryAt && retryAt.getTime() > Date.now();
  warning.hidden = !limited;
  if (limited) {
    const time = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(retryAt);
    warning.textContent = `OGWS đang giới hạn yêu cầu (429). Trạng thái lệnh có thể cập nhật chậm; server sẽ thử lại sau ${time}.`;
  } else {
    warning.textContent = "";
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
    if (value != null) {
      const description = type?.optionLabels?.[value];
      parts.push(`${type?.parameterLabel || "Giá trị"}: ${description ? `${description} (${value})` : value}`);
    }
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
    option.textContent = `${command.optionLabels?.[value] ?? value} (${value})`;

    parameterSelect.appendChild(option);
  });
}

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
