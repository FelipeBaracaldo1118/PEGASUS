// =====================================================
// Pegasus - profile.js FINAL COMPLETO
// Compatible con Keytester / Tester + Cookies Seguras
// =====================================================

// 🧠 Función para obtener token desde cookies
function getTokenFromCookie() {
  const cookie = document.cookie.split("; ").find(row => row.startsWith("token="));
  return cookie ? cookie.split("=")[1] : null;
}

// Esperar a que cargue el DOM
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 Cargando perfil...");

  // ✅ Obtener token
  const token = getTokenFromCookie();
  if (!token) {
    console.warn("⚠️ Token no encontrado. Redirigiendo al login...");
    window.location.href = "/index.html";
    return;
  }

  // ==============================
  // 🔹 1. Obtener datos del usuario
  // ==============================
  async function fetchUserData() {
    try {
      const res = await fetch("http://localhost:3000/api/user/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const user = await res.json();
      console.log("✅ Usuario autenticado:", user);

      renderProfile(user);

      if (user.userType === "keytester") {
        renderKeytesterPanel();
      } else {
        renderTesterPanel(user);
      }
    } catch (err) {
      console.error("❌ Error al obtener usuario:", err);
      alert("Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.");
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/index.html";
    }
  }

  // ============================================
  // 🔹 2. Renderizar información base del perfil
  // ============================================
  function renderProfile(user) {
    const container = document.getElementById("profile-info");
    if (!container) return;

    container.innerHTML = `
      <div class="profile-card">
        <h2>👤 Perfil de Usuario</h2>
        <p><strong>Usuario:</strong> ${user.Epam_user || user.username}</p>
        <p><strong>Rol:</strong> ${user.userType}</p>
        <p><strong>Pod:</strong> ${user.Pod || "N/A"}</p>
        <p><strong>Región:</strong> ${user.Region || "N/A"}</p>
        <p><strong>Estación:</strong> ${user.Station || "N/A"}</p>
        <p><strong>Disponibilidad:</strong> ${user.availability || "Desconocida"}</p>
        <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
      </div>
      <div id="dynamic-panel" class="dynamic-panel"></div>
    `;

    // Botón de logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/index.html";
    });
  }

  // ==========================================================
  // 🔹 3. Panel de control para Keytester (sesiones y testers)
  // ==========================================================
  async function renderKeytesterPanel() {
    const panel = document.getElementById("dynamic-panel");
    panel.innerHTML = `
      <h3>Panel de Control - Keytester</h3>
      <div class="btn-group">
        <button id="btn-sessions">📋 Ver Sesiones Activas</button>
        <button id="btn-testers">👥 Ver Todos los Testers</button>
        <button id="btn-create">➕ Crear Nueva Sesión</button>
      </div>
      <div id="data-area" class="data-area"></div>
    `;

    // Eventos
    document.getElementById("btn-sessions").addEventListener("click", renderSessions);
    document.getElementById("btn-testers").addEventListener("click", renderAllTesters);
    document.getElementById("btn-create").addEventListener("click", () => {
      window.location.href = "/pages/create-session.html";
    });
  }

  // 🔸 Ver sesiones activas
  async function renderSessions() {
    const area = document.getElementById("data-area");
    area.innerHTML = `<p>Cargando sesiones...</p>`;

    try {
      const res = await fetch("http://localhost:3000/api/sessions", {
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Error al obtener sesiones");

      const sessions = await res.json();
      if (!sessions.length) {
        area.innerHTML = `<p>No hay sesiones activas.</p>`;
        return;
      }

      area.innerHTML = sessions.map(s => `
        <div class="session-card">
          <h4>${s.backendName}</h4>
          <p><strong>Inicio:</strong> ${new Date(s.startTime).toLocaleString()}</p>
          <p><strong>Total jugadores:</strong> ${s.totalPlayers}</p>
          <p><strong>Creado por:</strong> ${s.createdBy?.Epam_user || "N/A"}</p>
        </div>
      `).join("");
    } catch {
      area.innerHTML = `<p>Error al cargar sesiones.</p>`;
    }
  }

  // 🔸 Ver testers registrados
  async function renderAllTesters() {
    const area = document.getElementById("data-area");
    area.innerHTML = `<p>Cargando testers...</p>`;

    try {
      const res = await fetch("http://localhost:3000/api/all-testers", {
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Error al obtener testers");

      const testers = await res.json();
      area.innerHTML = testers.map(t => `
        <div class="tester-card">
          <strong>${t.Epam_user}</strong> — ${t.Pod || "N/A"} — ${t.Region || "N/A"}<br>
          <span class="${t.availability === 'Disponible' ? 'green' : 'red'}">${t.availability}</span>
        </div>
      `).join("");
    } catch {
      area.innerHTML = `<p>Error al cargar testers.</p>`;
    }
  }

  // ==========================================================
  // 🔹 4. Panel para Tester (sesiones asignadas + comandos)
  // ==========================================================
  async function renderTesterPanel(user) {
    const panel = document.getElementById("dynamic-panel");
    panel.innerHTML = `
      <h3>Mis Sesiones Asignadas</h3>
      <div id="tester-sessions" class="data-area"><p>Cargando...</p></div>
    `;

    try {
      const res = await fetch("http://localhost:3000/api/user/my-sessions", {
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Error al obtener sesiones asignadas");

      const sessions = await res.json();

      if (!sessions.length) {
        document.getElementById("tester-sessions").innerHTML = `<p>No tienes sesiones asignadas actualmente.</p>`;
        return;
      }

      // Render sesiones + comandos generados
      const html = sessions.map(s => {
        const cmd = window.EpicCommandGenerator.generateCommand({
          buildIDOverride: s.idOverride || "",
          backend: s.backendName || "Cry",
          region: user.Region || "NAE",
          platform: s.assignment?.device || "PC",
          args: s.assignment?.capturas || []
        });

        return `
          <div class="session-card">
            <h4>${s.backendName}</h4>
            <p><strong>Inicio:</strong> ${new Date(s.startTime).toLocaleString()}</p>
            <p><strong>Capturas:</strong> ${s.assignment?.capturas?.join(", ") || "N/A"}</p>
            <p><strong>Dispositivo:</strong> ${s.assignment?.device || "N/A"}</p>
            <p><strong>Comando generado:</strong></p>
            <textarea readonly class="cmd-box">${cmd}</textarea>
          </div>
        `;
      }).join("");

      document.getElementById("tester-sessions").innerHTML = html + `
        <button id="historyBtn" class="history-btn">📜 Ver Historial</button>
      `;

      // Evento para historial
      document.getElementById("historyBtn").addEventListener("click", renderSessionHistory);

    } catch (err) {
      console.error(err);
      document.getElementById("tester-sessions").innerHTML = `<p>Error al cargar tus sesiones.</p>`;
    }
  }

  // 🔸 Ver historial de sesiones pasadas
  async function renderSessionHistory() {
    const area = document.getElementById("tester-sessions");
    area.innerHTML = `<p>Cargando historial...</p>`;

    try {
      const res = await fetch("http://localhost:3000/api/user/my-sessions", {
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include"
      });
      const sessions = await res.json();

      area.innerHTML = sessions.map(s => `
        <div class="session-card history">
          <h4>${s.backendName}</h4>
          <p>Fecha: ${new Date(s.startTime).toLocaleString()}</p>
          <p>Tipo: ${s.sessionType || "Normal"}</p>
          <p>Capturas: ${s.assignment?.capturas?.join(", ") || "N/A"}</p>
        </div>
      `).join("");
    } catch {
      area.innerHTML = `<p>Error al cargar historial.</p>`;
    }
  }

  // 🔹 Ejecutar flujo inicial
  await fetchUserData();
});
