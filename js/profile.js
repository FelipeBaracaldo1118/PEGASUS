// ===============================
// CONFIGURACIÓN INICIAL
// ===============================
const SERVER_URL = "http://10.13.46.195:8080";
const token = localStorage.getItem("token");
if (!token) window.location.href = "../index.html";

// ===============================
// OBTENER USUARIO ACTUAL
// ===============================
async function fetchUser() {
  try {
    const res = await fetch(`${SERVER_URL}/api/user/me`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error("Error al obtener usuario");

    const user = await res.json();

    document.getElementById("user-name").textContent = user.Epam_user;
    document.getElementById("user-role").textContent =
      user.userType === "keytester" ? "Keytester" : "Tester";

    renderProfileData(user);
    renderActions(user);

    // Si es tester → cargar automáticamente su panel
    if (user.userType === "tester") {
      loadTesterPanel(user);
    }
  } catch (err) {
    console.error(err);
    window.location.href = "../index.html";
  }
}

// ===============================
// RENDER PERFIL
// ===============================
function renderProfileData(user) {
  const container = document.getElementById("profile-data");
  container.innerHTML = `
    <div><label>Usuario:</label><span>${user.Epam_user}</span></div>
    <div><label>Rol:</label><span>${user.userType}</span></div>
    <div><label>Pod:</label><span>${user.Pod || "N/A"}</span></div>
    <div><label>Región:</label><span>${user.Region || "N/A"}</span></div>
    <div><label>Estación:</label><span>${user.Station || "N/A"}</span></div>
    <div><label>Disponibilidad:</label><span>${user.availability}</span></div>
  `;
}

// ===============================
// BOTONES Y ACCIONES (KEYTESTER)
// ===============================
function renderActions(user) {
  const createBtn = document.getElementById("create-session-btn");
  const viewSessionsBtn = document.getElementById("view-sessions-btn");
  const viewTestersBtn = document.getElementById("view-testers-btn");

  if (user.userType === "tester") {
    createBtn.style.display = "none";
    viewTestersBtn.style.display = "none";
  }

  createBtn.addEventListener("click", () => {
    window.location.href = "../html/SessionCreator.html";
  });
  viewSessionsBtn.addEventListener("click", showSessions);
  viewTestersBtn.addEventListener("click", showAllTesters);
}

// ===============================
// PANEL DINÁMICO
// ===============================
function openPanel(title) {
  const panel = document.getElementById("dynamic-panel");
  const titleEl = document.getElementById("panel-title");
  const content = document.getElementById("dynamic-content");
  titleEl.textContent = title;
  panel.classList.remove("hidden");
  content.innerHTML = "";
  return content;
}

document.getElementById("close-panel").addEventListener("click", () => {
  document.getElementById("dynamic-panel").classList.add("hidden");
});

// ===============================
// PANEL AUTOMÁTICO PARA TESTER
// ===============================
async function loadTesterPanel(user) {
  const content = openPanel("Sesión actual");
  content.innerHTML = "<p>Cargando datos...</p>";

  try {
    const res = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error("Error al cargar sesiones del tester");

    const sessions = await res.json();
    if (!sessions.length) {
      content.innerHTML = `<p>No tienes sesiones asignadas actualmente.</p>`;
      return;
    }

    const current = sessions[0];
    const captures = current.assignment?.capturas || [];
    const platform = current.assignment?.device || "PC";
    const backend = current.backendName || "Cry";
    const region = user.Region || "NAE";
    const build = current.buildString || "❓";

    // Generar comando con EpicCommandGenerator
    const command = EpicCommandGenerator.generateCommand({
      buildIDOverride: build,
      backend,
      region,
      platform,
      args: captures,
    });

    // Render
    content.innerHTML = `
      <div class="dynamic-card">
        <h4>Comando generado:</h4>
        <code id="command-code">${command}</code>
        <button id="copy-command" class="action-btn create-btn" style="margin-top:10px;">
          📋 Copiar comando
        </button>
      </div>
      <div class="dynamic-card">
        <p><strong>Tipo de archivo capturado:</strong> ${captures.join(", ") || "N/A"}</p>
        <p><strong>Tipo de juego:</strong> ${current.sessionType || "N/A"}</p>
      </div>
      <button class="action-btn view-btn" id="view-history-btn">
        🕓 Ver histórico de sesiones
      </button>
    `;

    // Copiar comando al portapapeles
    document.getElementById("copy-command").addEventListener("click", () => {
      navigator.clipboard.writeText(command).then(() => {
        const btn = document.getElementById("copy-command");
        btn.textContent = "✅ Copiado";
        setTimeout(() => (btn.textContent = "📋 Copiar comando"), 2000);
      });
    });

    // Botón histórico
    document
      .getElementById("view-history-btn")
      .addEventListener("click", () => showTesterHistory(sessions));
  } catch (err) {
    console.error(err);
    content.innerHTML = `<p>Error al cargar datos del tester.</p>`;
  }
}

// ===============================
// HISTÓRICO DE SESIONES TESTER
// ===============================
function showTesterHistory(sessions) {
  const content = openPanel("Histórico de sesiones");
  if (!sessions.length) {
    content.innerHTML = "<p>No hay sesiones previas.</p>";
    return;
  }

  content.innerHTML = sessions
    .map(
      (s) => `
      <div class="dynamic-card">
        <h4>${s.backendName || "Sesión sin nombre"}</h4>
        <p><strong>Build:</strong> ${s.buildString || "N/A"}</p>
        <p><strong>Tipo:</strong> ${s.sessionType}</p>
        <p><strong>Fecha:</strong> ${new Date(s.createdAt).toLocaleString()}</p>
        <p><strong>Capturas:</strong> ${s.assignment?.capturas?.join(", ") || "N/A"}</p>
      </div>`
    )
    .join("");
}

// ===============================
// SESIONES (KEYTESTER)
// ===============================
async function showSessions() {
  const panel = openPanel("Sesiones activas");
  panel.innerHTML = "<p>Cargando sesiones...</p>";

  try {
    const res = await fetch(`${SERVER_URL}/api/sessions`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error("Error al obtener sesiones");

    const sessions = await res.json();
    if (!sessions.length) {
      panel.innerHTML = "<p>No hay sesiones activas.</p>";
      return;
    }

    panel.innerHTML = sessions
      .map(
        (s) => `
      <div class="dynamic-card">
        <h4>${s.backendName || "Sin nombre"} (${s.sessionType})</h4>
        <p><strong>Build:</strong> ${s.buildString || "N/A"}</p>
        <p><strong>Jugadores:</strong> ${s.totalPlayers || 0}</p>
      </div>`
      )
      .join("");
  } catch (err) {
    panel.innerHTML = "<p>Error al cargar sesiones.</p>";
  }
}

// ===============================
// TESTERS (KEYTESTER)
// ===============================
async function showAllTesters() {
  const panel = openPanel("Testers registrados");
  panel.innerHTML = "<p>Cargando testers...</p>";

  try {
    const res = await fetch(`${SERVER_URL}/api/all-testers`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error("Error al cargar testers");

    const testers = await res.json();
    panel.innerHTML = testers
      .map(
        (t) => `
      <div class="dynamic-card">
        <h4>${t.Epam_user}</h4>
        <p><strong>Pod:</strong> ${t.Pod}</p>
        <p><strong>Estación:</strong> ${t.Station}</p>
        <p><strong>Disponibilidad:</strong> ${t.availability}</p>
      </div>`
      )
      .join("");
  } catch (err) {
    panel.innerHTML = "<p>Error al mostrar testers.</p>";
  }
}

// ===============================
// BÚSQUEDA
// ===============================
document.getElementById("searchInput").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll(".dynamic-card").forEach((c) => {
    c.style.display = c.textContent.toLowerCase().includes(term)
      ? "block"
      : "none";
  });
});

// ===============================
// LOGOUT
// ===============================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await fetch(`${SERVER_URL}/logout`, {
      method: "POST",
      headers: { Authorization: token },
    });
  } catch (err) {
    console.warn("Error cerrando sesión:", err);
  } finally {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
});

// ===============================
// INICIO
// ===============================
fetchUser();
