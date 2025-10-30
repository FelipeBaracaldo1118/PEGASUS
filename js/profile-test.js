const SERVER_URL = "http://10.13.46.195:3000";

const token = localStorage.getItem("token");

// Si no hay token, enviar al login inmediatamente
if (!token) {
    window.location.href = "/index.html";
} else {
    // Verificar token con el backend
    fetch(`${SERVER_URL}/protected`, {
        method: "GET",
        headers: { "Authorization": token }
    })
        .then(async res => {
            if (!res.ok) {
                // Token inválido o expirado, limpiar y enviar al login
                localStorage.removeItem("token");
                window.location.href = "/index.html";
            }
        })
        .catch(err => {
            console.error("Error verificando token:", err);
            localStorage.removeItem("token");
            window.location.href = "/index.html";
        });
}

// Función para mostrar errores
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    document.getElementById('loading').style.display = 'none';
}

// Función para verificar el token
function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        showError("No has iniciado sesión");
        window.location.href = "/index.html";
        return null;
    }
    return token;
}

// Variable global para almacenar la información del usuario actual
let currentUser = null;

// ====================== PERFIL PRINCIPAL ======================
async function fetchProfile() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${SERVER_URL}/api/user/me`, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const user = await response.json();
        currentUser = user;

        // Mostrar información del perfil principal
        let html = `
            <div><label>Usuario EPAM:</label> ${user.Epam_user || 'N/A'}</div>
            <div><label>Accounts:</label> ${Array.isArray(user.Accounts) ? user.Accounts.join(", ") : 'N/A'}</div>
            <div><label>Devices:</label> ${Array.isArray(user.Devices) ? user.Devices.map(d => d.name).join(", ") : 'N/A'}</div>
            <div><label>Pod:</label> ${user.Pod || 'N/A'}</div>
            <div><label>Región:</label> ${user.Region || 'N/A'}</div>
            <div><label>Estación:</label> ${user.Station || 'N/A'}</div>
            <div><label>Disponibilidad:</label> ${user.availability || 'N/A'}</div>
            <div><label>IsPlaying:</label> ${user.IsPlaying ? "Sí" : "No"}</div>
            <div><label>Rol:</label> ${user.userType || (user.isAdmin ? "keytester" : "tester")}</div>
        `;
        document.getElementById("profile-data").innerHTML = html;

        // Renderizar en el menú lateral (si existe)
        const sidebar = document.getElementById("profile-info");
        if (sidebar) {
            sidebar.innerHTML = `
                <p><strong>Usuario EPAM:</strong> ${user.Epam_user}</p>
                <p><strong>Accounts:</strong> ${user.Accounts?.join(", ")}</p>
                <p><strong>Devices:</strong> ${user.Devices?.map(d => d.name).join(", ")}</p>
                <p><strong>Pod:</strong> ${user.Pod}</p>
                <p><strong>Región:</strong> ${user.Region}</p>
                <p><strong>Estación:</strong> ${user.Station}</p>
                <p><strong>Disponibilidad:</strong> ${user.availability}</p>
                <p><strong>IsPlaying:</strong> ${user.IsPlaying ? "Sí" : "No"}</p>
                <p><strong>Rol:</strong> ${user.userType}</p>
            `;
        }

        // Acciones para keytester
        if (user.userType === "keytester" || user.isAdmin) {
            const actionsHtml = `
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
            document.getElementById("profile-actions").innerHTML = actionsHtml;
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
            headers: { "Authorization": token }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const sessions = await response.json();
        window.lastSessions = sessions;

        let html = "";
        if (!sessions || sessions.length === 0) {
            html = "<p>No tienes ninguna playtest asignada.</p>";
        } else {
            html = "<h3>Sesiones Asignadas</h3>";
            sessions.forEach(session => {
                const myTester = session.assignedTesters.find(
                    t => t.Epam_user === currentUser.Epam_user
                );

                let args = [];
                if (myTester && Array.isArray(myTester.capturas)) {
                    args = myTester.capturas.filter(c => validArgs.includes(c));
                }

                const hasLWM = args.includes("LWM_BR");
                const config = {
                    buildIDOverride: session.idOverride,
                    backend: session.backendName,
                    region: session.region || 'EU',
                    platform: myTester ? myTester.device : 'Other',
                    args
                };
                const command = window.EpicCommandGenerator.generateCommand(config);
                const sessionId = session._id;

                html += `
    <div class="assigned-session-card">
        <div class="assigned-session-title">${session.backendName || '-'}</div>
        <div class="assigned-session-details">
            <p><strong>Build:</strong> ${session.buildString || '-'}</p>
            <p><strong>ID Override:</strong> ${session.idOverride || '-'}</p>
            <p><strong>Dispositivo Asignado:</strong> ${myTester ? myTester.device : '-'}</p>
            <p><strong>Capturas:</strong> ${myTester?.capturas?.join(', ') || 'No asignadas'}</p>
            <p><strong>Fecha:</strong> ${session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '-'}</p>
            <div class="command-section">
                <label><strong>Línea de comando:</strong></label>
                <pre id="command-box-${sessionId}" class="command-box" style="color:#111;background:#fff;">${command}</pre>
                <button class="copy-btn" onclick="copyCommand('${sessionId}')">Copiar</button>
                ${hasLWM ? `<button class="toggle-br-btn" id="toggle-br-btn-${sessionId}" onclick="toggleBR('${sessionId}')">BR</button>` : ""}
            </div>
        </div>
    </div>
`;
            });
        }
        document.getElementById("tester-sessions").innerHTML = html;

    } catch (error) {
        document.getElementById("tester-sessions").innerHTML =
            `<div class="error">Error al cargar la playtest: ${error.message}</div>`;
    }
}

// ====================== UTILIDADES ======================
function toggleBR(sessionId) {
    const commandBox = document.getElementById(`command-box-${sessionId}`);
    const toggleBtn = document.getElementById(`toggle-br-btn-${sessionId}`);
    const session = window.lastSessions.find(s => s._id === sessionId);
    const myTester = session.assignedTesters.find(t => t.Epam_user === currentUser.Epam_user);

    let args = [...myTester.capturas];
    const isBR = toggleBtn.classList.contains("active");

    args = args.map(a => {
        if (isBR && a === "LWM_BR") return "LWM";
        if (!isBR && a === "LWM") return "LWM_BR";
        return a;
    });

    toggleBtn.classList.toggle("active");

    const config = {
        buildIDOverride: session.idOverride,
        backend: session.backendName,
        region: session.region || 'EU',
        platform: myTester.device,
        args
    };

    commandBox.textContent = window.EpicCommandGenerator.generateCommand(config);
}

function copyCommand(sessionId) {
    const textElem = document.getElementById(`command-box-${sessionId}`);
    if (!textElem) return alert("No se encontró el comando a copiar");
    navigator.clipboard.writeText(textElem.textContent)
        .then(() => alert("Comando copiado ✅"))
        .catch(() => alert("No se pudo copiar"));
}

// ====================== CERRAR SESIÓN ======================
function logout() {
    const token = localStorage.getItem("token");
    if (token) {
        fetch(`${SERVER_URL}/logout`, {
            method: "POST",
            headers: { "Authorization": token, "Content-Type": "application/json" }
        })
            .then(res => res.json())
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

// ====================== MENÚ DE PERFIL (HAMBURGUESA) ======================
document.addEventListener("DOMContentLoaded", () => {
    const profileToggle = document.querySelector(".profile-toggle");
    const profileMenu = document.querySelector(".profile-menu");
    const overlay = document.querySelector(".overlay");
    const closeProfile = document.querySelector(".close-profile");

    if (profileToggle && profileMenu && overlay && closeProfile) {
        profileToggle.addEventListener("click", () => {
            profileMenu.classList.add("open");
            overlay.classList.add("active");
            profileToggle.classList.add("hidden"); // Oculta el botón mientras el menú está abierto
        });

        closeProfile.addEventListener("click", () => {
            profileMenu.classList.remove("open");
            overlay.classList.remove("active");
            profileToggle.classList.remove("hidden");
        });

        overlay.addEventListener("click", () => {
            profileMenu.classList.remove("open");
            overlay.classList.remove("active");
            profileToggle.classList.remove("hidden");
        });
    }
});
