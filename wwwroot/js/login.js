const form = document.getElementById("login-form");
const errorBox = document.getElementById("login-error");
const errorText = errorBox.querySelector("span");
const button = document.getElementById("login-button");
const toggle = document.getElementById("toggle-password");
const password = document.getElementById("password");

fetch("/api/auth/me", { credentials: "same-origin" }).then((response) => {
  if (response.ok) window.location.replace("/");
}).catch(() => {});

toggle.addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
  toggle.setAttribute("aria-label", password.type === "password" ? "Hiện mật khẩu" : "Ẩn mật khẩu");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  button.disabled = true;
  button.querySelector(".login-button__text").hidden = true;
  button.querySelector(".login-button__loading").hidden = false;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        username: document.getElementById("username").value.trim(),
        password: password.value,
        rememberMe: document.getElementById("remember-me").checked,
      }),
    });
    if (!response.ok) {
      errorText.textContent = response.status === 401
        ? "Tên đăng nhập hoặc mật khẩu không chính xác."
        : "Không thể đăng nhập lúc này. Vui lòng thử lại.";
      errorBox.hidden = false;
      return;
    }
    window.location.replace("/");
  } catch {
    errorText.textContent = "Không thể kết nối máy chủ. Vui lòng thử lại.";
    errorBox.hidden = false;
  } finally {
    button.disabled = false;
    button.querySelector(".login-button__text").hidden = false;
    button.querySelector(".login-button__loading").hidden = true;
  }
});
