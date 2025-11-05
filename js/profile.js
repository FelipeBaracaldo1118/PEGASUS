// ====================== CONFIGURACIÓN ======================
const SERVER_URL = "http://10.13.46.195:8080";

// ====================== INICIO DE PERFIL ======================
document.addEventListener("DOMContentLoaded", async () => {
  await fetchUserData();
});

// ====================== AUTENTICACIÓN Y PERFIL ======================
async function fetchUserData() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("Token no encontrado. Redirigiendo...");
    return (window.location.href = "../index.html");
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      console.warn("Token inválido o expirado. Redirigiendo...");
      localStorage.removeItem("token");
      return (window.location.href = "../index.html");
    }

    const user = await res.json();
    renderProfile(user);
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    alert("Error al autenticar. Inicia sesión nuevamente.");
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
}

// ====================== RENDER PERFIL ======================
function renderProfile(user) {
  const profileData = document.getElementById("profile-data");
  const actions = document.getElementById("profile-actions");
  const dynamicArea = document.getElementById("dynamic-area");

  // Datos principales
  profileData.innerHTML = `
    <div><label>Usuario EPAM:</label> ${user.Epam_user}</div>
    <div><label>Rol:</label> ${user.userType}</div>
    <div><label>Región:</label> ${user.Region}</div>
    <div><label>Pod:</label> ${user.Pod}</div>
    <div><label>Estación:</label> ${user.Station}</div>
    <div><label>Disponibilidad:</label> ${user.availability}</div>
  `;

  actions.innerHTML = "";

  // Si es KeyTester (Administrador)
  if (user.userType === "keytester") {
    actions.innerHTML = `
      <button class="action-btn create-btn" id="createSessionBtn">Crear nueva sesión</button>
      <button class="action-btn view-btn" id="viewSessionsBtn">Ver sesiones activas</button>
      <button class="action-btn view-btn" id="viewTestersBtn">Ver testers</button>
    `;

    document
      .getElementById("createSessionBtn")
      .addEventListener("click", () => (window.location.href = "../keytester_sessions.html"));
    document
      .getElementById("viewSessionsBtn")
      .addEventListener("click", showSessions);
    document
      .getElementById("viewTestersBtn")
      .addEventListener("click", showAllTesters);
  }

  // Si es Tester
  if (user.userType === "tester") {
    actions.innerHTML = `
      <button class="action-btn view-btn" id="viewMySessionsBtn">Mis sesiones</button>
      <button class="action-btn view-btn" id="viewHistoryBtn">Ver histórico</button>
    `;

    document
      .getElementById("viewMySessionsBtn")
      .addEventListener("click", () => showTesterSessions(user));
    document
      .getElementById("viewHistoryBtn")
      .addEventListener("click", () => showSessionHistory(user));
  }

  dynamicArea.innerHTML = `<p>Selecciona una opción para continuar.</p>`;
}

// ====================== KEYTESTER: SESIONES ======================
async function showSessions() {
  const token = localStorage.getItem("token");
  const dynamicArea = document.getElementById("dynamic-area");
  dynamicArea.innerHTML = `<p>Cargando sesiones...</p>`;

  try {
    const res = await fetch(`${SERVER_URL}/api/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener sesiones");
    const sessions = await res.json();

    if (sessions.length === 0) {
      dynamicArea.innerHTML = `<p>No hay sesiones registradas.</p>`;
      return;
    }

    dynamicArea.innerHTML = `
      <h3>Sesiones creadas</h3>
      ${sessions
        .map(
          (s) => `
        <div class="assigned-session-card">
          <div class="assigned-session-title">${s.backendName}</div>
          <p><b>Build:</b> ${s.buildString || "N/A"}</p>
          <p><b>Región:</b> ${s.Region || "N/A"}</p>
          <p><b>Fecha:</b> ${new Date(s.createdAt).toLocaleString()}</p>
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    console.error("Error al listar sesiones:", error);
    dynamicArea.innerHTML = `<p style="color:red">Error al cargar sesiones.</p>`;
  }
}

// ====================== KEYTESTER: TESTERS ======================
async function showAllTesters() {
  const token = localStorage.getItem("token");
  const dynamicArea = document.getElementById("dynamic-area");
  dynamicArea.innerHTML = `<p>Cargando testers...</p>`;

  try {
    const res = await fetch(`${SERVER_URL}/api/all-testers`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener testers");
    const testers = await res.json();

    dynamicArea.innerHTML = `
      <h3>Testers registrados</h3>
      ${testers
        .map(
          (t) => `
        <div class="assigned-session-card">
          <p><b>${t.Epam_user}</b></p>
          <p><b>Región:</b> ${t.Region}</p>
          <p><b>Pod:</b> ${t.Pod}</p>
          <p><b>Disponibilidad:</b> ${t.availability}</p>
          <button class="action-btn view-btn" onclick="toggleAvailability('${t._id}', '${t.availability}')">
            ${t.availability === "Disponible" ? "Marcar como Ocupado" : "Marcar como Disponible"}
          </button>
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    console.error("Error al listar testers:", error);
    dynamicArea.innerHTML = `<p style="color:red">Error al cargar testers.</p>`;
  }
}

// ====================== CAMBIAR DISPONIBILIDAD ======================
async function toggleAvailability(testerId, currentStatus) {
  const token = localStorage.getItem("token");
  const newStatus = currentStatus === "Disponible" ? "Ocupado" : "Disponible";

  try {
    const res = await fetch(`${SERVER_URL}/api/users/${testerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availability: newStatus }),
    });

    if (!res.ok) throw new Error("Error al cambiar disponibilidad");
    showAllTesters(); // refrescar lista
  } catch (error) {
    console.error("Error:", error);
    alert("No se pudo cambiar la disponibilidad");
  }
}

// ====================== TESTER: SESIONES ASIGNADAS ======================
async function showTesterSessions(user) {
  const token = localStorage.getItem("token");
  const dynamicArea = document.getElementById("dynamic-area");
  dynamicArea.innerHTML = `<p>Cargando tus sesiones...</p>`;

  try {
    const res = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener tus sesiones");
    const sessions = await res.json();

    if (sessions.length === 0) {
      dynamicArea.innerHTML = `<p>No tienes sesiones asignadas actualmente.</p>`;
      return;
    }

    dynamicArea.innerHTML = `
      <h3>Sesiones asignadas</h3>
      ${sessions
        .map((s) => {
          const cmd = window.EpicCommandGenerator.generateCommand({
            buildIDOverride: s.idOverride || "",
            backend: s.backendName || "Cry",
            region: s.assignment?.pod || "LATAM",
            platform: s.assignment?.device || "Other",
            args: s.assignment?.capturas || [],
          });

          return `
          <div class="assigned-session-card">
            <div class="assigned-session-title">${s.backendName}</div>
            <p><b>Build:</b> ${s.buildString}</p>
            <p><b>Dispositivo:</b> ${s.assignment?.device || "N/A"}</p>
            <p><b>Capturas:</b> ${s.assignment?.capturas?.join(", ") || "N/A"}</p>
            <p><b>Comando generado:</b></p>
            <div class="cmd-box">${cmd}</div>
            <button class="action-btn view-btn" onclick="copyCommand('${cmd}')">Copiar comando</button>
          </div>
        `;
        })
        .join("")}
    `;
  } catch (error) {
    console.error("Error al cargar sesiones del tester:", error);
    dynamicArea.innerHTML = `<p style="color:red">Error al cargar tus sesiones.</p>`;
  }
}

// ====================== HISTÓRICO DEL TESTER ======================
async function showSessionHistory(user) {
  const token = localStorage.getItem("token");
  const dynamicArea = document.getElementById("dynamic-area");
  dynamicArea.innerHTML = `<p>Cargando histórico...</p>`;

  try {
    const res = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener histórico");
    const sessions = await res.json();

    dynamicArea.innerHTML = `
      <h3>Histórico de sesiones</h3>
      ${sessions
        .map(
          (s) => `
        <div class="assigned-session-card">
          <p><b>${s.backendName}</b> - ${new Date(s.startTime).toLocaleString()}</p>
          <p><b>Dispositivo:</b> ${s.assignment?.device || "N/A"}</p>
          <p><b>Capturas:</b> ${s.assignment?.capturas?.join(", ") || "N/A"}</p>
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    console.error("Error al cargar histórico:", error);
    dynamicArea.innerHTML = `<p style="color:red">Error al cargar histórico.</p>`;
  }
}

// ====================== UTILIDAD: COPIAR COMANDO ======================
function copyCommand(cmd) {
  navigator.clipboard.writeText(cmd);
  alert("Comando copiado al portapapeles ✅");
}
