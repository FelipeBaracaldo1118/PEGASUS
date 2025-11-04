// ====================== CONFIGURACIÓN BASE ======================
const SERVER_URL = "http://10.13.46.195:3000";

// Verificación inicial del token
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/index.html";
} else {
  fetch(`${SERVER_URL}/protected`, {
    method: "GET",
    headers: { Authorization: token },
  })
    .then(async (res) => {
      if (!res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
      }
    })
    .catch((err) => {
      console.error("Error verificando token:", err);
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    });
}

// ====================== UTILIDADES ======================
function showError(message) {
  const errorDiv = document.getElementById("message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.color = "red";
  }
}

function getToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("No has iniciado sesión");
    window.location.href = "/index.html";
    return null;
  }
  return token;
}

let currentUser = null;

// ====================== PERFIL PRINCIPAL ======================
async function fetchProfile() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${SERVER_URL}/api/user/me`, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const user = await response.json();
    currentUser = user;

    // Render principal
    const profileData = document.getElementById("profile-data");
    profileData.innerHTML = `
      <div><label>Usuario EPAM:</label> ${user.Epam_user || "N/A"}</div>
      <div><label>Accounts:</label> ${Array.isArray(user.Accounts) ? user.Accounts.join(", ") : "N/A"}</div>
      <div><label>Devices:</label> ${Array.isArray(user.Devices) ? user.Devices.map(d => d.name).join(", ") : "N/A"}</div>
      <div><label>Pod:</label> ${user.Pod || "N/A"}</div>
      <div><label>Región:</label> ${user.Region || "N/A"}</div>
      <div><label>Estación:</label> ${user.Station || "N/A"}</div>
      <div><label>Disponibilidad:</label> ${user.availability || "N/A"}</div>
      <div><label>IsPlaying:</label> ${user.IsPlaying ? "Sí" : "No"}</div>
      <div><label>Rol:</label> ${user.userType || (user.isAdmin ? "keytester" : "tester")}</div>
    `;

    // Mostrar también en el menú lateral
    const sidebar = document.getElementById("profile-info");
    if (sidebar) {
      sidebar.innerHTML = `
        <p><strong>Usuario EPAM:</strong> ${user.Epam_user}</p>
        <p><strong>Accounts:</strong> ${user.Accounts?.join(", ") || "N/A"}</p>
        <p><strong>Devices:</strong> ${user.Devices?.map(d => d.name).join(", ") || "N/A"}</p>
        <p><strong>Pod:</strong> ${user.Pod}</p>
        <p><strong>Región:</strong> ${user.Region}</p>
        <p><strong>Estación:</strong> ${user.Station}</p>
        <p><strong>Disponibilidad:</strong> ${user.availability}</p>
        <p><strong>IsPlaying:</strong> ${user.IsPlaying ? "Sí" : "No"}</p>
        <p><strong>Rol:</strong> ${user.userType}</p>
      `;
    }

    // Mostrar acciones según rol
    const actionsDiv = document.getElementById("profile-actions");
    if (user.userType === "keytester" || user.isAdmin) {
      actionsDiv.innerHTML = `
        <div class="keytester-actions">
          <button class="action-btn create-btn" onclick="window.location.href='/keytester_sessions.html'">
            Crear sesión de juego
          </button>
          <button class="action-btn view-btn" onclick="showPodTesters()">Ver testers de mi pod</button>
          <button class="action-btn view-btn" onclick="showAllTesters()">Ver todos los testers</button>
        </div>
        <div id="testers-container" class="testers-container"></div>
        <div id="sessions-list"></div>
      `;
      await fetchKeyTesterSessions();
    } else {
      await fetchTesterSessions();
    }
  } catch (error) {
    showError("Error al cargar el perfil: " + error.message);
  }
}

// ====================== SESIONES DE TESTER ======================
const validArgs = ["Trace", "LLM", "LWM_BR", "LWM_NoBR", "Razor", "NoTimeout"];

async function fetchTesterSessions() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
      headers: { Authorization: token },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const sessions = await response.json();
    window.lastSessions = sessions;

    const testerSessions = document.getElementById("tester-sessions");
    if (!sessions || sessions.length === 0) {
      testerSessions.innerHTML = "<p>No tienes ninguna playtest asignada.</p>";
      return;
    }

    let html = "<h3>Sesiones Asignadas</h3>";
    sessions.forEach((session) => {
      const myTester = session.assignedTesters.find(
        (t) => t.Epam_user === currentUser.Epam_user
      );

      let args = [];
      if (myTester && Array.isArray(myTester.capturas)) {
        args = myTester.capturas.filter((c) => validArgs.includes(c));
      }

      const hasLWM = args.includes("LWM_BR");
      const config = {
        buildIDOverride: session.idOverride,
        backend: session.backendName,
        region: session.region || "EU",
        platform: myTester ? myTester.device : "Other",
        args,
      };

      const command = window.EpicCommandGenerator.generateCommand(config);
      const sessionId = session._id;

      html += `
        <div class="assigned-session-card">
          <div class="assigned-session-title">${session.backendName || "-"}</div>
          <p><strong>Build:</strong> ${session.buildString || "-"}</p>
          <p><strong>ID Override:</strong> ${session.idOverride || "-"}</p>
          <p><strong>Dispositivo:</strong> ${myTester ? myTester.device : "-"}</p>
          <p><strong>Capturas:</strong> ${
            myTester?.capturas?.join(", ") || "No asignadas"
          }</p>
          <p><strong>Fecha:</strong> ${
            session.createdAt
              ? new Date(session.createdAt).toLocaleDateString()
              : "-"
          }</p>
          <div class="command-section">
            <label><strong>Línea de comando:</strong></label>
            <pre id="command-box-${sessionId}" class="command-box">${command}</pre>
            <button class="copy-btn" onclick="copyCommand('${sessionId}')">Copiar</button>
            ${
              hasLWM
                ? `<button class="toggle-br-btn" id="toggle-br-btn-${sessionId}" onclick="toggleBR('${sessionId}')">BR</button>`
                : ""
            }
          </div>
        </div>
      `;
    });

    testerSessions.innerHTML = html;
  } catch (error) {
    showError("Error al cargar la playtest: " + error.message);
  }
}

// ====================== SESIONES DE KEYTESTER ======================
async function fetchKeyTesterSessions() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${SERVER_URL}/api/sessions`, {
      headers: { Authorization: token },
    });

    if (!res.ok) throw new Error("Error obteniendo sesiones del keytester");

    const sessions = await res.json();
    let html = "<h3>Sesiones Creadas</h3>";
    sessions.forEach((s) => {
      html += `
        <div class="assigned-session-card">
          <div class="assigned-session-title">${s.backendName}</div>
          <p><strong>Build:</strong> ${s.buildString}</p>
          <p><strong>ID Override:</strong> ${s.idOverride}</p>
          <p><strong>Región:</strong> ${s.region}</p>
          <p><strong>Fecha:</strong> ${
            s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"
          }</p>
        </div>`;
    });

    document.getElementById("tester-sessions").innerHTML = html;
  } catch (error) {
    showError("Error al cargar las sesiones del keytester: " + error.message);
  }
}

// ====================== UTILIDADES DE COMANDOS ======================
function toggleBR(sessionId) {
  const commandBox = document.getElementById(`command-box-${sessionId}`);
  const toggleBtn = document.getElementById(`toggle-br-btn-${sessionId}`);
  const session = window.lastSessions.find((s) => s._id === sessionId);
  const myTester = session.assignedTesters.find(
    (t) => t.Epam_user === currentUser.Epam_user
  );

  let args = [...myTester.capturas];
  const isBR = toggleBtn.classList.contains("active");

  args = args.map((a) => {
    if (isBR && a === "LWM_BR") return "LWM";
    if (!isBR && a === "LWM") return "LWM_BR";
    return a;
  });

  toggleBtn.classList.toggle("active");

  const config = {
    buildIDOverride: session.idOverride,
    backend: session.backendName,
    region: session.region || "EU",
    platform: myTester.device,
    args,
  };

  commandBox.textContent = window.EpicCommandGenerator.generateCommand(config);
}

function copyCommand(sessionId) {
  const textElem = document.getElementById(`command-box-${sessionId}`);
  if (!textElem) return alert("No se encontró el comando a copiar");
  navigator.clipboard
    .writeText(textElem.textContent)
    .then(() => alert("Comando copiado ✅"))
    .catch(() => alert("No se pudo copiar"));
}

// ====================== LOGOUT ======================
function logout() {
  const token = localStorage.getItem("token");
  if (token) {
    fetch(`${SERVER_URL}/logout`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
    })
      .then(() => {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
      });
  } else {
    window.location.href = "/index.html";
  }
}

// ====================== INICIALIZACIÓN ======================
document.addEventListener("DOMContentLoaded", fetchProfile);
