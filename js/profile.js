const SERVER_URL = "http://10.13.46.195:3000";

// === TOKEN VALIDATION ===
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

// === UTILITIES ===
function showError(message) {
  const errorDiv = document.getElementById("error");
  if (errorDiv) errorDiv.textContent = message;
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
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

// === MAIN PROFILE ===
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

    // PROFILE INFO
    let html = `
      <div><label>Usuario EPAM:</label> ${user.Epam_user || "N/A"}</div>
      <div><label>Accounts:</label> ${Array.isArray(user.Accounts) ? user.Accounts.join(", ") : "N/A"}</div>
      <div><label>Devices:</label> ${Array.isArray(user.Devices) ? user.Devices.map((d) => d.name).join(", ") : "N/A"}</div>
      <div><label>Pod:</label> ${user.Pod || "N/A"}</div>
      <div><label>Región:</label> ${user.Region || "N/A"}</div>
      <div><label>Estación:</label> ${user.Station || "N/A"}</div>
      <div><label>Disponibilidad:</label> ${user.availability || "N/A"}</div>
      <div><label>IsPlaying:</label> ${user.IsPlaying ? "Sí" : "No"}</div>
      <div><label>Rol:</label> ${user.userType || (user.isAdmin ? "keytester" : "tester")}</div>
    `;
    document.getElementById("profile-data").innerHTML = html;

    // ACTIONS
    if (user.userType === "keytester" || user.isAdmin) {
      const actionsHtml = `
        <div class="keytester-actions">
          <button class="action-btn create-btn" onclick="window.location.href='/keytester_sessions.html'">
            Crear sesión de juego
          </button>
          <button class="action-btn view-btn" onclick="showPodTesters()">
            Ver testers de mi pod
          </button>
          <button class="action-btn view-btn" onclick="showAllTesters()">
            Ver todos los testers
          </button>
        </div>
      `;
      document.getElementById("profile-actions").innerHTML = actionsHtml;

      // ✅ Always load created sessions below
      await fetchKeyTesterSessions();
    } else {
      await fetchTesterSessions();
    }
  } catch (error) {
    showError("Error al cargar el perfil: " + error.message);
  }
}

// === KEYTESTER SESSIONS (always visible below profile) ===
async function fetchKeyTesterSessions() {
  const token = getToken();
  if (!token) return;

  const container = document.getElementById("tester-sessions");
  container.innerHTML = '<div class="loading">Cargando sesiones...</div>';

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions`, {
      headers: { Authorization: token },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const sessions = await response.json();

    if (sessions.length === 0) {
      container.innerHTML = "<p>No has creado sesiones aún.</p>";
      return;
    }

    let html = "<h3>Sesiones Creadas</h3>";
    sessions.forEach((session) => {
      html += `
        <div class="session-card">
          <div class="session-header">
            <div class="session-title">${session.backendName || "-"}</div>
            <button class="edit-btn" onclick="editSession('${session._id}')">
              Editar Sesión
            </button>
          </div>
          <div class="session-details">
            <p><strong>ID Override:</strong> ${session.idOverride || "-"}</p>
            <p><strong>Total Players:</strong> ${session.totalPlayers || "-"}</p>
            <p><strong>Build:</strong> ${session.buildString || "-"}</p>
            <p><strong>Testers Asignados:</strong> ${session.assignedTesters?.length || 0}</p>
            <p><strong>Fecha:</strong> ${new Date(session.createdAt).toLocaleDateString()}</p>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div class="error">Error al cargar las sesiones: ${error.message}</div>`;
  }
}

// === POD TESTERS ===
async function showPodTesters() {
  const token = getToken();
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");

  title.textContent = "Testers de mi pod";
  content.innerHTML = '<div class="loading">Cargando testers...</div>';

  try {
    const res = await fetch(`${SERVER_URL}/api/testers-in-pod`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error("Error HTTP: " + res.status);
    const testers = await res.json();

    if (!testers.length) {
      content.innerHTML = "<p>No hay testers en tu pod.</p>";
      return;
    }

    let html = `
      <table class="styled-table">
        <thead>
          <tr><th>Usuario</th><th>Pod</th><th>Estación</th><th>Región</th><th>Dispositivos</th></tr>
        </thead>
        <tbody>
          ${testers
            .map(
              (t) => `
            <tr>
              <td>${t.Epam_user}</td>
              <td>${t.Pod}</td>
              <td>${t.Station}</td>
              <td>${t.Region}</td>
              <td>${Array.isArray(t.Devices) ? t.Devices.map((d) => d.name).join(", ") : "-"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    content.innerHTML = html;
  } catch (error) {
    content.innerHTML = `<div class="error">Error al cargar testers: ${error.message}</div>`;
  }
}

// === ALL TESTERS ===
async function showAllTesters() {
  const token = getToken();
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");

  title.textContent = "Todos los testers";
  content.innerHTML = '<div class="loading">Cargando testers...</div>';

  try {
    const res = await fetch(`${SERVER_URL}/api/all-testers`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error("Error HTTP: " + res.status);
    const testers = await res.json();

    if (!testers.length) {
      content.innerHTML = "<p>No hay testers registrados.</p>";
      return;
    }

    let html = `
      <table class="styled-table">
        <thead>
          <tr><th>Usuario</th><th>Pod</th><th>Estación</th><th>Región</th><th>Dispositivos</th></tr>
        </thead>
        <tbody>
          ${testers
            .map(
              (t) => `
            <tr>
              <td>${t.Epam_user}</td>
              <td>${t.Pod}</td>
              <td>${t.Station}</td>
              <td>${t.Region}</td>
              <td>${Array.isArray(t.Devices) ? t.Devices.map((d) => d.name).join(", ") : "-"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    content.innerHTML = html;
  } catch (error) {
    content.innerHTML = `<div class="error">Error al cargar testers: ${error.message}</div>`;
  }
}

// === EDIT SESSION LINK ===
function editSession(sessionId) {
  window.location.href = `/edit_session.html?id=${sessionId}`;
}

// === LOGOUT ===
function logout() {
  const token = localStorage.getItem("token");
  if (token) {
    fetch(`${SERVER_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
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

// === INIT ===
document.addEventListener("DOMContentLoaded", fetchProfile);
