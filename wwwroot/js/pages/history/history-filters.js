import { getDevices } from "../../api.js";

export function initializeMessageTypeSelect() {
  const select = document.getElementById("history-type");
  const wrapper = document.createElement("div");

  wrapper.className = "history-type-select";
  select.before(wrapper);
  wrapper.append(select);
  select.hidden = true;

  const trigger = document.createElement("button");

  trigger.type = "button";
  trigger.id = "history-type-trigger";
  trigger.className = "history-type-trigger";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "history-type-options");
  trigger.textContent = select.selectedOptions[0].textContent.trim();

  const label = document.querySelector('label[for="history-type"]');

  label.htmlFor = trigger.id;
  label.id = "history-type-label";
  trigger.setAttribute("aria-labelledby", label.id);

  const list = document.createElement("div");

  list.id = "history-type-options";
  list.className = "history-device-options";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-labelledby", label.id);
  list.hidden = true;
  wrapper.append(trigger, list);

  let activeIndex = select.selectedIndex;

  const close = () => {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
  };

  const highlight = () => {
    [...list.children].forEach((item, index) => {
      item.setAttribute("aria-selected", String(index === activeIndex));
    });

    const activeItem = list.children[activeIndex];

    if (!activeItem) return;

    trigger.setAttribute("aria-activedescendant", activeItem.id);
    list.scrollTop = Math.max(0, activeItem.offsetTop - list.clientHeight / 2);
  };

  const open = () => {
    activeIndex = select.selectedIndex;
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    highlight();
  };

  const choose = (index) => {
    select.selectedIndex = index;
    trigger.textContent = select.options[index].textContent.trim();
    select.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  };

  [...select.options].forEach((option, index) => {
    const item = document.createElement("div");

    item.id = `history-type-option-${index}`;
    item.setAttribute("role", "option");
    item.textContent = option.textContent.trim();
    item.addEventListener("click", () => choose(index));
    list.append(item);
  });

  list.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  trigger.addEventListener("click", () => {
    if (list.hidden) {
      open();
    } else {
      close();
    }
  });

  trigger.addEventListener("blur", close);

  trigger.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();

      if (list.hidden) {
        open();
        return;
      }

      if (event.key === "Home") {
        activeIndex = 0;
      } else if (event.key === "End") {
        activeIndex = select.options.length - 1;
      } else {
        const direction = event.key === "ArrowDown" ? 1 : -1;

        activeIndex =
          (activeIndex + direction + select.options.length) %
          select.options.length;
      }

      highlight();
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && !list.hidden) {
      event.preventDefault();
      choose(activeIndex);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });

  wrapper.closest(".history-page").addEventListener(
    "scroll",
    (event) => {
      if (event.target !== list) {
        close();
      }
    },
    { capture: true, passive: true },
  );
}

export async function initializeDeviceSelect() {
  const dataList = document.getElementById("history-device-options");
  const input = document.getElementById("history-device");

  if (!dataList || !input) return;

  let deviceIds = [];
  let activeIndex = -1;

  const close = () => {
    dataList.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  };

  const choose = (value) => {
    input.value = value;
    close();
  };

  const highlight = (options) => {
    options.forEach((option, index) => {
      option.setAttribute("aria-selected", String(index === activeIndex));
    });

    const activeOption = options[activeIndex];

    if (!activeOption) return;

    input.setAttribute("aria-activedescendant", activeOption.id);

    if (activeOption.offsetTop < dataList.scrollTop) {
      dataList.scrollTop = activeOption.offsetTop;
    } else if (
      activeOption.offsetTop + activeOption.offsetHeight >
      dataList.scrollTop + dataList.clientHeight
    ) {
      dataList.scrollTop =
        activeOption.offsetTop +
        activeOption.offsetHeight -
        dataList.clientHeight;
    }
  };

  const open = () => {
    const query = input.value.trim().toLowerCase();
    const filteredIds = deviceIds.filter((id) =>
      id.toLowerCase().includes(query),
    );

    dataList.replaceChildren();
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");

    for (const id of filteredIds) {
      const option = document.createElement("div");

      option.id = `history-device-option-${dataList.children.length}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = id;
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      option.addEventListener("click", () => choose(id));
      dataList.append(option);
    }

    if (!dataList.children.length) {
      const empty = document.createElement("div");

      empty.className = "history-device-options__empty";
      empty.textContent = "Không có thiết bị gợi ý";
      dataList.append(empty);
    }

    dataList.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("focus", open);
  input.addEventListener("click", open);
  input.addEventListener("input", open);
  input.addEventListener("blur", close);

  dataList.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (dataList.hidden) {
        open();
      }

      const options = [...dataList.querySelectorAll('[role="option"]')];

      if (!options.length) return;

      if (activeIndex < 0) {
        activeIndex = event.key === "ArrowDown" ? 0 : options.length - 1;
      } else {
        const direction = event.key === "ArrowDown" ? 1 : -1;

        activeIndex =
          (activeIndex + direction + options.length) % options.length;
      }

      highlight(options);
      return;
    }

    if (event.key === "Enter" && !dataList.hidden && activeIndex >= 0) {
      event.preventDefault();

      const options = dataList.querySelectorAll('[role="option"]');
      choose(options[activeIndex].textContent);
    }
  });

  try {
    const devices = await getDevices();

    if (!input.isConnected) return;

    deviceIds = [
      ...new Set(devices.map((device) => device.mobileId).filter(Boolean)),
    ];

    if (document.activeElement === input) {
      open();
    }
  } catch (error) {
    console.error("Không tải được danh sách thiết bị:", error);
  }
}

export function setDefaultDateRange() {
  document.getElementById("history-from").value = "";
  document.getElementById("history-to").value = "";
}

export function getHistoryFilters() {
  return {
    mobileId: document.getElementById("history-device").value.trim(),
    from: document.getElementById("history-from").value,
    to: document.getElementById("history-to").value,
    messageType: document.getElementById("history-type").value,
  };
}
