// Token check
if (!token) {
  window.location.href = "../index.html";
} else {
  fetch(`${SERVER_URL}/protected`, {
    method: "GET",
    headers: { Authorization: token },
  })
    .then((res) => {
      if (!res.ok) {
        localStorage.removeItem("token");
        window.location.href = "../index.html";
      }
    })
    .catch((err) => {
      console.error("Error verificando token:", err);
      localStorage.removeItem("token");
      window.location.href = "../index.html";
    });
}

// === SAFE WRITERS ===
function safeWrite(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
  else console.warn(`⚠️ Element #${id} not found`);
}

function showInPanel(title, html) {
  const panel = document.getElementById("dynamic-panel");
  const titleEl = document.getElementById("panel-title");
  const contentEl = document.getElementById("dynamic-content");

  if (panel && titleEl && contentEl) {
    titleEl.textContent = title;
    contentEl.innerHTML = html;
    panel.classList.remove("hidden");
  } else {
    // fallback if panel not found
    safeWrite("testers-container", html);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ testerManagement.js ready");
});

// === KEEPING YOUR ORIGINAL LOGIC ===

// UI Setup
function setupKeyTesterUI() {
  const actions = document.getElementById("profile-actions");
  if (!actions) return;
  actions.innerHTML = `
    <button class="logout-btn" onclick="window.location.href='keytester_sessions.html'">
      Crear sesión de juego
    </button>
    <button class="logout-btn" onclick="fetchTestersInPod()">
      Ver testers de mi pod
    </button>
    <button class="logout-btn" onclick="fetchAllTesters()">
      Ver todos los testers
    </button>
    <div id="tester-list" class="tester-list"></div>
  `;
}

// Keytester sessions
async function fetchKeyTesterSessions() {
  const token = getToken();
  if (!token) return;

  const container = document.getElementById("sessions-list") || document.getElementById("dynamic-content");
  if (!container) return;

  container.innerHTML = '<div class="loading">Cargando sesiones...</div>';

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions`, {
      headers: { Authorization: token },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const sessions = await response.json();

    if (sessions.length === 0) {
      container.innerHTML = "<h3>No has creado sesiones aún</h3>";
      return;
    }

    let html = "<h3>Sesiones Creadas</h3>";
    sessions.forEach((session) => {
      html += `
        <div class="session-card">
          <div class="session-header">
            <div class="session-title">${session.backendName} - ${session.startTime}</div>
            <button class="edit-btn" onclick="editSession('${session._id}')">Editar Sesión</button>
          </div>
          <div class="session-details">
            <p class="id-override"><strong>ID Override:</strong> ${session.idOverride}</p>
            <p><strong>Total Players:</strong> ${session.totalPlayers}</p>
            <p><strong>Build:</strong> ${session.buildString}</p>
            <p><strong>Testers Asignados:</strong> ${session.assignedTesters.length}</p>
            <p><strong>Fecha:</strong> ${new Date(session.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error("Error en fetchKeyTesterSessions:", error);
    container.innerHTML = `<div class="error">Error al cargar las sesiones: ${error.message}</div>`;
  }
}

// Show pod testers
async function showPodTesters() {
  const container = document.getElementById("testers-container") || document.getElementById("dynamic-content");
  if (!container) return;

  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const response = await fetch(`${SERVER_URL}/api/testers-in-pod`, {
      headers: { Authorization: getToken() },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const testers = await response.json();

    let html = `
      <div class="testers-section">
        <button class="close-table-btn" onclick="closeTestersTable()">Cerrar</button>
        <h3>Todos los Testers</h3>
        ${renderTestersTable(testers)}
      </div>
    `;
    showInPanel("Testers de mi pod", html);
  } catch (error) {
    console.error(error);
    showInPanel("Error", `<div class="error">Error al cargar testers: ${error.message}</div>`);
  }
}

// Show all testers
function showAllTesters() {
  const token = getToken();
  if (!token) return;

  fetch(`${SERVER_URL}/api/all-testers`, {
    headers: { Authorization: token },
  })
    .then((res) => res.json())
    .then((testers) => {
      let html = `
        <div class="testers-list-header">
          <h3>Todos los Testers</h3>
          <button class="btn-close-list" onclick="closeTestersTable()">Cerrar</button>
        </div>
        <table class="styled-table">
          <thead>
            <tr>
              <th>Usuario EPAM</th>
              <th>Pod</th>
              <th>Estación</th>
              <th>Región</th>
              <th>Dispositivos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
      `;

      testers.forEach((t) => {
        html += `
          <tr>
            <td>${t.Epam_user}</td>
            <td>${t.Pod || ""}</td>
            <td>${t.Station || ""}</td>
            <td>${t.Region || ""}</td>
            <td>${
              Array.isArray(t.Devices)
                ? t.Devices.map((d) => d.name).join(", ")
                : ""
            }</td>
            <td>
              <button class="view-btn" onclick="viewTesterProfile('${t._id}')">Ver Perfil</button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      showInPanel("Todos los testers", html);
    })
    .catch((err) => {
      console.error(err);
      showInPanel("Error", `<div class="error">Error al cargar testers: ${err.message}</div>`);
    });
}

// View tester profile (modal)
function viewTesterProfile(testerId) {
  const token = getToken();
  if (!token) return;

  fetch(`${SERVER_URL}/api/user/${testerId}`, {
    headers: { Authorization: token },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((user) => {
      const overlay = document.createElement("div");
      overlay.classList.add("modal-overlay");

      const modal = document.createElement("div");
      modal.classList.add("modal-box");
      modal.innerHTML = `
        <h3>Perfil de ${user.Epam_user}</h3>
        <p><strong>Accounts:</strong> ${user.Accounts?.join(", ") || "-"}</p>
        <p><strong>Devices:</strong> ${
          user.Devices?.map((d) => d.name).join(", ") || "-"
        }</p>
        <p><strong>Pod:</strong> ${user.Pod || "-"}</p>
        <p><strong>Región:</strong> ${user.Region || "-"}</p>
        <p><strong>Estación:</strong> ${user.Station || "-"}</p>
        <p><strong>Disponibilidad:</strong> ${user.availability || "-"}</p>
        <p><strong>Rol:</strong> ${user.userType}</p>
        <p><strong>IsPlaying:</strong> ${user.IsPlaying ? "Sí" : "No"}</p>
        <div style="text-align:right;">
          <button class="close-btn">Cerrar</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      modal.querySelector(".close-btn").addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });
    })
    .catch((err) => {
      console.error(err);
      alert("Error al cargar el perfil del tester");
    });
}

// Helpers
function renderTestersTable(testers) {
  return `
    <div class="testers-table">
      <table>
        <thead>
          <tr>
            <th>Usuario EPAM</th>
            <th>Pod</th>
            <th>Estación</th>
            <th>Región</th>
            <th>Dispositivos</th>
          </tr>
        </thead>
        <tbody>
          ${testers
            .map(
              (t) => `
            <tr>
              <td>${t.Epam_user || ""}</td>
              <td>${t.Pod || t.pod || ""}</td>
              <td>${t.Station || t.station || ""}</td>
              <td>${t.Region || t.region || ""}</td>
              <td>${
                Array.isArray(t.Devices)
                  ? t.Devices.map((d) => d.name).join(", ")
                  : t.Devices || ""
              }</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function closeTestersTable() {
  const container = document.getElementById("testers-container") || document.getElementById("dynamic-content");
  if (container) container.innerHTML = "";
}

function editSession(sessionId) {
  window.location.href = `edit_session.html?id=${sessionId}`;
}
