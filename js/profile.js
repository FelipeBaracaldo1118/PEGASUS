
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
            // Si es válido, dejamos al usuario donde está
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

// Función principal para cargar el perfil
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

        // Mostrar información del perfil
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

        // Configurar acciones para keytester
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
        <div id="testers-container"
 class="testers-container"></div>
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

async function fetchTesterSessions() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
            headers: { "Authorization": token }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const sessions = await response.json();

        let html = "";
        if (!sessions || sessions.length === 0) {
            html = "<p>No tienes ninguna playtest asignada.</p>";
        } else {
            html = "<h3>Sesiones Asignadas</h3>";
            sessions.forEach(session => {
                const myTester = session.assignedTesters.find(
                    t => t.Epam_user === currentUser.Epam_user
                );

                // Lógica para los argumentos:
                let args = [];
                if (myTester && Array.isArray(myTester.capturas)) {
                    if (
                        myTester.capturas.length === 1 &&
                        myTester.capturas[0] === "CSVProfile"
                    ) {
                        args = [];
                    } else {
                        args = myTester.capturas.filter(c => c.toUpperCase() !== "CSVPROFILE");
                    }
                }

                // Excluye DX12 y DX11 (case-insensitive)
                args = args.filter(c => {
                    const val = c.toUpperCase();
                    return val !== "DX12" && val !== "DX11";
                });

                // Guarda si tiene LWM
                const hasLWM = args.includes("LWM_BR");

                // Genera el comando (por defecto, sin BR)
                const config = {
                    buildIDOverride: session.idOverride,
                    backend: session.backendName,
                    region: session.region || 'EU',
                    platform: myTester ? myTester.device : 'Other',
                    args
                };

                const command = window.EpicCommandGenerator.generateCommand(config);

                // Identificador único para los elementos
                const sessionId = session._id;

                html += `
    <div class="assigned-session-card">
        <div class="assigned-session-title">${session.backendName || '-'}</div>
        <div class="assigned-session-details">
            <p><strong>Build:</strong> ${session.buildString || '-'}</p>
            
            <p><strong>ID Override:</strong> ${session.idOverride || session.idOverrideA || session.idOverrideB || '-'}</p>
            <p><strong>Dispositivo Asignado:</strong> ${myTester ? myTester.device : '-'}</p>
            <p><strong>Capturas:</strong> ${myTester && Array.isArray(myTester.capturas)
                        ? myTester.capturas.join(', ')
                        : 'No asignadas'
                    }</p>
            <p><strong>Fecha:</strong> ${session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '-'}</p>
            <div class="command-section">
                <label><strong>Línea de comando:</strong></label>
                <pre id="command-box-${sessionId}" class="command-box">${command}</pre>
                <button class="copy-btn" onclick="copyCommand('${sessionId}')">Copiar</button>
                ${hasLWM ? `
                    <button class="toggle-br-btn" id="toggle-br-btn-${sessionId}" onclick="toggleBR('${sessionId}')">BR</button>
                ` : ''}
            </div>
        </div>
    </div>
`;
            });
        }
        document.getElementById("tester-sessions").innerHTML = html;
    } catch (error) {
        document.getElementById("tester-sessions").innerHTML = `<div class="error">Error al cargar la playtest: ${error.message}</div>`;
    }
}
function toggleBR(sessionId) {
    // Busca el bloque de la sesión en el DOM
    const commandBox = document.getElementById(`command-box-${sessionId}`);
    const toggleBtn = document.getElementById(`toggle-br-btn-${sessionId}`);

    // Encuentra la sesión y el tester en la variable global (puedes guardar sessions en una variable global si lo necesitas)
    // Aquí asumo que tienes acceso a sessions y currentUser
    const session = window.lastSessions.find(s => s._id === sessionId);
    const myTester = session.assignedTesters.find(
        t => t.Epam_user === currentUser.Epam_user
    );

    // Clona las capturas y reemplaza LWM por LWM_BR si el botón está activado
    let args = [];
    let isBR = toggleBtn.classList.contains('active');
    if (myTester && Array.isArray(myTester.capturas)) {
        if (
            myTester.capturas.length === 1 &&
            myTester.capturas[0] === "CSVProfile"
        ) {
            args = [];
        } else {
            args = myTester.capturas.filter(c => c !== "CSVProfile");
            // Si el botón está activado, reemplaza LWM por LWM_BR
            if (!isBR) {
                args = args.map(a => a === "LWM" ? "LWM_BR" : a);
                toggleBtn.classList.add('active');
            } else {
                args = args.map(a => a === "LWM_BR" ? "LWM" : a);
                toggleBtn.classList.remove('active');
            }
        }
    }
    window.lastSessions = sessions;

    const config = {
        buildIDOverride: session.idOverride,
        backend: session.backendName,
        region: session.region || 'EU',
        platform: myTester ? myTester.device : 'Other',
        args
    };
    const command = window.EpicCommandGenerator.generateCommand(config);

    commandBox.textContent = command;
}
function copyCommand(sessionId) {
    const textElem = document.getElementById(`command-box-${sessionId}`);
    if (!textElem) {
        alert("No se encontró el comando a copiar");
        return;
    }
    const text = textElem.textContent;

    if (navigator.clipboard && window.isSecureContext) {
        // Método moderno (HTTPS o localhost)
        navigator.clipboard.writeText(text)
            .then(() => {
                alert("Comando copiado ✅");
            })
            .catch(err => {
                console.error("Error al copiar:", err);
                alert("No se pudo copiar");
            });
    } else {
        // Fallback para HTTP o navegadores antiguos
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed"; // Evita que se mueva la página
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            const successful = document.execCommand("copy");
            if (successful) {
                alert("Comando copiado ✅");
            } else {
                alert("No se pudo copiar el comando");
            }
        } catch (err) {
            console.error("Fallback error:", err);
            alert("No se pudo copiar");
        }
        document.body.removeChild(textarea);
    }
}
// Iniciar la carga del perfil cuando se carga la página
document.addEventListener('DOMContentLoaded', fetchProfile);

// Función para cerrar sesión

function logout() {
    const token = localStorage.getItem("token");

    if (token) {
        fetch(`${SERVER_URL}/logout`, {
            method: "POST",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data.message);
                localStorage.removeItem("token");
                window.location.href = "/index.html";
            })
            .catch(err => {
                console.error("Error en logout:", err);
                localStorage.removeItem("token");
                window.location.href = "/index.html";
            });
    } else {
        window.location.href = "/index.html";
    }
}
