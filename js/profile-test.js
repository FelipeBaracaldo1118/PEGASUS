// ✅ ESTE ARCHIVO SOLO ES PARA PRUEBAS SIN SERVIDOR
console.warn("⚠️ profile-test.js ACTIVADO - Usando datos falsos, no del servidor");

let currentUser = null;

// 🧩 Datos falsos (simulan respuesta del backend)
const fakeUser = {
  Epam_user: "manuel.nino",
  Accounts: ["EpicGames", "GitHub"],
  Devices: [{ name: "PS5" }], // <- usa PS4 o PS5 para activar el GEN
  Pod: "Pegasus",
  Region: "LATAM",
  Station: "Bogotá HQ",
  availability: "Available",
  IsPlaying: false,
  userType: "tester",
  isAdmin: false
};

// 🎮 Sesiones falsas (simulan respuesta del backend)
const fakeSessions = [
  {
    _id: "session123",
    backendName: "Backend Pegasus",
    buildString: "v1.5.8",
    idOverride: "OVR-122",
    gameModes: "Battle Royale",
    region: "LATAM",
    createdAt: new Date().toISOString(),
    assignedTesters: [
      {
        Epam_user: "manuel.nino",
        device: "PS5",
        capturas: ["LWM_BR", "Razor"]
      }
    ]
  }
];

// 🧠 Simula la carga del perfil
async function fetchProfile() {
  currentUser = fakeUser;

  // Mostrar datos del usuario
  const html = `
    <div><label>Usuario EPAM:</label> ${fakeUser.Epam_user}</div>
    <div><label>Accounts:</label> ${fakeUser.Accounts.join(", ")}</div>
    <div><label>Devices:</label> ${fakeUser.Devices.map(d => d.name).join(", ")}</div>
    <div><label>Pod:</label> ${fakeUser.Pod}</div>
    <div><label>Región:</label> ${fakeUser.Region}</div>
    <div><label>Estación:</label> ${fakeUser.Station}</div>
    <div><label>Disponibilidad:</label> ${fakeUser.availability}</div>
    <div><label>IsPlaying:</label> ${fakeUser.IsPlaying ? "Sí" : "No"}</div>
    <div><label>Rol:</label> ${fakeUser.userType}</div>
  `;
  document.getElementById("profile-data").innerHTML = html;

  // Cargar sesiones falsas
  await fetchTesterSessions();
}

// 🔍 Simula fetchTesterSessions() sin servidor
async function fetchTesterSessions() {
  const sessions = fakeSessions;
  let html = "";
  const statusElement = document.createElement("div");
  statusElement.id = "assignment-status";
  statusElement.style.fontWeight = "bold";
  statusElement.style.fontSize = "1.2rem";
  statusElement.style.textAlign = "center";
  statusElement.style.marginBottom = "15px";

  if (!sessions || sessions.length === 0) {
    // ❌ No asignado
    statusElement.textContent = "Usted no está asignado";
    statusElement.style.color = "#ff4d4d";
    html = "<p>No tienes ninguna playtest asignada.</p>";
  } else {
    // ✅ Asignado
    statusElement.textContent = "Usted está asignado";
    statusElement.style.color = "#00ff88";
    html = "<h3>Sesiones Asignadas</h3>";

    sessions.forEach(session => {
      const myTester = session.assignedTesters.find(
        t => t.Epam_user === currentUser.Epam_user
      );

      let args = [];
      if (myTester && Array.isArray(myTester.capturas)) {
        if (
          myTester.capturas.length === 1 &&
          myTester.capturas[0] === "CSVProfile"
        ) {
          args = [];
        } else {
          args = myTester.capturas.filter(c => c !== "CSVProfile");
        }
      }

      const hasLWM = args.includes("LWM_BR");

      // 🎯 Simula comando generado
      const config = {
        buildIDOverride: session.idOverride,
        backend: session.backendName,
        region: session.region || "EU",
        platform: myTester ? myTester.device : "Other",
        args
      };
      const command = `SimulatedCommand --backend=${config.backend} --region=${config.region} --platform=${config.platform} --args=${args.join(",")}`;

      const sessionId = session._id;

      html += `
        <div class="assigned-session-card">
          <div class="assigned-session-title">${session.backendName}</div>
          <div class="assigned-session-details">
            <p><strong>Build:</strong> ${session.buildString}</p>
            <div class="assigned-session-row">
              <span class="assigned-session-label">Game Modes:</span>
              <span>${session.gameModes}</span>
            </div>
            <p><strong>ID Override:</strong> ${session.idOverride}</p>
            <p><strong>Dispositivo Asignado:</strong> ${myTester ? myTester.device : ''}</p>
            <p><strong>Capturas:</strong> ${myTester && Array.isArray(myTester.capturas)
              ? myTester.capturas.join(', ')
              : 'No asignadas'}</p>
            <p><strong>Fecha:</strong> ${session.createdAt
              ? new Date(session.createdAt).toLocaleDateString()
              : ''}</p>
            <div class="command-section">
              <label><strong>Línea de comando:</strong></label>
              <pre id="command-box-${sessionId}" class="command-box">${command}</pre>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('command-box-${sessionId}').textContent)">Copiar</button>
              ${hasLWM
                ? `<button class="toggle-br-btn" id="toggle-br-btn-${sessionId}" onclick="toggleBR('${sessionId}')">BR</button>`
                : ""}
            </div>
          </div>
        </div>
      `;
    });
  }

  const container = document.getElementById("tester-sessions");
  container.innerHTML = "";
  container.appendChild(statusElement);
  container.insertAdjacentHTML("beforeend", html);
}

// ⚡ Simula el toggle BR
function toggleBR(sessionId) {
  const btn = document.getElementById(`toggle-br-btn-${sessionId}`);
  const box = document.getElementById(`command-box-${sessionId}`);
  const isActive = btn.classList.toggle("active");

  let command = box.textContent;
  if (isActive) {
    btn.textContent = "BR✓";
    command = command.replace("LWM_NoBR", "LWM_BR");
  } else {
    btn.textContent = "BR";
    command = command.replace("LWM_BR", "LWM_NoBR");
  }
  box.textContent = command;
}

// 🚪 Cerrar sesión (simulado)
function logout() {
  alert("Sesión cerrada (modo test)");
  window.location.href = "index.html";
}

// 🚀 Ejecutar al cargar
document.addEventListener("DOMContentLoaded", fetchProfile);
