
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

  const Epam_user = document.getElementById("login-username").value;
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

      // Consulta el perfil para saber el tipo de usuario
      const userRes = await fetch(`${SERVER_URL}/api/user/me`, {
        headers: { "Authorization": result.token }
      });
      const user = await userRes.json();

      // Redirige según el tipo de usuario
      if (user.isAdmin || user.userType === "keytester") {
        window.location.href = "/pages/profile.html"; // O el HTML que desees
      } else {
        // Renderiza la vista normal
        document.getElementById("message").innerText = "Inicio de sesión exitoso.";
        document.getElementById("message").style.color = "green";
        setTimeout(() => {
          loginSection.style.display = "none";
          appContent.style.display = "block";
        }, 800);
        //Opcional: Redirigir o recargar
        window.location.href = "pages/Profile.html";
      }
    } else {
      document.getElementById("message").innerText = result.message || "Error al iniciar sesión.";
      document.getElementById("message").style.color = "red";
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    document.getElementById("message").innerText = "No se pudo conectar con el servidor.";
    document.getElementById("message").style.color = "red";
  }
});

// Registro
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Captura los valores del formulario
  const Epam_user = document.getElementById("epam-user").value;
  const Password = document.getElementById("register-password").value;
  const Accounts = selectedAccounts;


  // Solo nombre de dispositivos, prioridad fija
  const Devices = [];
  const device1 = document.getElementById("register-device1").value;
  if (device1) Devices.push({ name: device1, priority: 1 });
  const device2 = document.getElementById("register-device2").value;
  if (device2) Devices.push({ name: device2, priority: 2 });

  //const isAdmin = document.getElementById("register-isadmin").checked;
  const Pod = document.getElementById("register-pod").value;
  const Region = document.getElementById("register-region").value;
  const Station = document.getElementById("register-station").value;

  // Valores por defecto para los campos ocultos
  const userData = {
    Epam_user,
    Password,
    Accounts,
    Devices,
    availability: "", // No editable por el usuario
    Mmr: 0,           // No editable por el usuario
    isAdmin: false,
    Pod,
    Region,
    Station,
    IsPlaying: false  // No editable por el usuario
  };

  try {
    const res = await fetch(`${SERVER_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (res.ok) {
      message.style.color = "lime";
      message.innerText = "Registro exitoso. Ahora puedes iniciar sesión.";
      registerForm.reset();
      localStorage.setItem('token', data.token); // Si el backend devuelve el token

      // Redirige después de 1 segundo
      setTimeout(() => {
        window.location.href = "pages/profile.html";
      }, 1000);
    } else {
      message.style.color = "red";
      message.innerText = data.message || "Error al registrarse.";
    }
  } catch {
    message.style.color = "red";
    message.innerText = "Error de conexión con el servidor.";
  }
});
// --- Manejo de selección múltiple (Cuentas Disponibles) ---
const accountSelect = document.getElementById("register-accounts-select");
const accountContainer = document.getElementById("selected-accounts");
let selectedAccounts = [];

accountSelect.addEventListener("change", () => {
  const value = accountSelect.value;
  if (value && !selectedAccounts.includes(value)) {
    selectedAccounts.push(value);
    renderAccountChips();
  }
  accountSelect.value = ""; // reset
});

function renderAccountChips() {
  accountContainer.innerHTML = "";
  selectedAccounts.forEach(account => {
    const chip = document.createElement("div");
    chip.className = "tag-item"; // ✅ Usamos tu clase ya definida en CSS

    // ✅ Nombre de la cuenta
    const label = document.createElement("span");
    label.textContent = account;

    // ✅ Botón (X) pequeño para eliminar
    const removeBtn = document.createElement("span");
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("data-account", account);
    removeBtn.style.cursor = "pointer";

    // ✅ Evento para eliminar chip
    removeBtn.addEventListener("click", () => {
      selectedAccounts = selectedAccounts.filter(acc => acc !== account);
      renderAccountChips();
    });

    // ✅ Agregar elementos al chip
    chip.appendChild(label);
    chip.appendChild(removeBtn);
    accountContainer.appendChild(chip);
  });
}


