// main.js

const SERVER_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "http://10.13.46.195:3000";

const loginSection = document.getElementById("login-section");
const appContent = document.getElementById("app-content");
const message = document.getElementById("message");
const toggleForm = document.getElementById("toggleForm");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// Alternar entre Login y Registro
toggleForm.addEventListener("click", () => {
  const showingLogin = loginForm.style.display !== "none";

  if (showingLogin) {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    toggleForm.textContent = "¿Ya tienes cuenta? Inicia sesión";
  } else {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    toggleForm.textContent = "¿No tienes cuenta? Regístrate";
  }
});

// Mostrar app si hay token
if (localStorage.getItem("token")) {
  loginSection.style.display = "none";
  appContent.style.display = "block";
}

// Login
document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const Epam_user = "EPAM-" + document.getElementById("login-username").value;
  const Password = document.getElementById("login-password").value;

  try {
    const response = await fetch("http://10.13.46.195:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Epam_user, Password }),
    });

    const result = await response.json();

    if (response.ok && result.token) {
      localStorage.setItem('token', result.token);

      const userRes = await fetch(`${SERVER_URL}/api/user/me`, {
        headers: { "Authorization": result.token }
      });
      const user = await userRes.json();

      if (user.isAdmin || user.userType === "keytester") {
        window.location.href = "/pages/profile.html";
      } else {
        message.innerText = "Inicio de sesión exitoso.";
        message.style.color = "green";
        setTimeout(() => {
          loginSection.style.display = "none";
          appContent.style.display = "block";
        }, 800);
      }
    } else {
      message.innerText = result.message || "Error al iniciar sesión.";
      message.style.color = "red";
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    message.innerText = "No se pudo conectar con el servidor.";
    message.style.color = "red";
  }
});

// Registro
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const Epam_user = "EPAM-" + document.getElementById("epam-user").value;
  const Password = document.getElementById("register-password").value;
  const Accounts = selectedAccounts;
  const Devices = [];
  const device1 = document.getElementById("register-device1").value;
  if (device1) Devices.push({ name: device1, priority: 1 });
  const device2 = document.getElementById("register-device2").value;
  if (device2) Devices.push({ name: device2, priority: 2 });

  const Pod = document.getElementById("register-pod").value;
  const Region = document.getElementById("register-region").value;
  const Station = document.getElementById("register-station").value;

  const userData = {
    Epam_user, Password, Accounts, Devices,
    availability: "", Mmr: 0, isAdmin: false,
    Pod, Region, Station, IsPlaying: false
  };

  try {
    const res = await fetch(`${SERVER_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    message.innerText = res.ok ? "Registro exitoso. Ahora puedes iniciar sesión." : (data.message || "Error al registrarse.");
    message.style.color = res.ok ? "lime" : "red";

    if (res.ok) registerForm.reset();
  } catch {
    message.style.color = "red";
    message.innerText = "Error de conexión con el servidor.";
  }
});

// Cuentas seleccionadas
const accountSelect = document.getElementById("register-accounts-select");
const accountContainer = document.getElementById("selected-accounts");
let selectedAccounts = [];

accountSelect.addEventListener("change", () => {
  const value = accountSelect.value;
  if (value && !selectedAccounts.includes(value)) {
    selectedAccounts.push(value);
    renderAccountChips();
  }
  accountSelect.value = "";
});

function renderAccountChips() {
  accountContainer.innerHTML = "";
  selectedAccounts.forEach(account => {
    const chip = document.createElement("div");
    chip.className = "tag-item";

    const label = document.createElement("span");
    label.textContent = account;

    const removeBtn = document.createElement("span");
    removeBtn.textContent = "✕";
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("click", () => {
      selectedAccounts = selectedAccounts.filter(acc => acc !== account);
      renderAccountChips();
    });

    chip.appendChild(label);
    chip.appendChild(removeBtn);
    accountContainer.appendChild(chip);
  });
}

// Modo desarrollo
const DEV_MODE = true;
if (DEV_MODE) {
  console.warn("⚠️ MODO DESARROLLO ACTIVADO - Saltando login y verificación de token.");
  loginSection.style.display = "none";
  appContent.style.display = "block";
}

// HAMBURGUER MENU JS 
  const hamburger = document.getElementById('hamburger-btn');
  const sideMenu = document.getElementById('side-menu');
  const overlay = document.getElementById('overlay');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sideMenu.classList.toggle('open');
    overlay.classList.toggle('show');
  });

  // Cerrar si tocan el overlay
  overlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    sideMenu.classList.remove('open');
    overlay.classList.remove('show');
  });
  
  // FINAL HAMBURGUER MENU JS //



