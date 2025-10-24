
// Configuración de la UI para keytesters
function setupKeyTesterUI() {
    const actions = document.getElementById("profile-actions");
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

// Función para cargar sesiones de keytester
async function fetchKeyTesterSessions() {
    const token = getToken();
    if (!token) return;

    const container = document.getElementById("sessions-list");
    container.innerHTML = '<div class="loading">Cargando sesiones...</div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/sessions`, {
            headers: { "Authorization": token }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const sessions = await response.json();

        if (sessions.length === 0) {
            container.innerHTML = "<h3>No has creado sesiones aún</h3>";
            return;
        }

        let html = "<h3>Sesiones Creadas</h3>";
        sessions.forEach(session => {
            html += `
        <div class="session-card">
          <div class="session-header">
            <div class="session-title">${session.backendName} - ${session.startTime}</div>
            <button class="edit-btn" onclick="editSession('${session._id}')">
              Editar Sesión
            </button>
          </div>
          <div class="session-details">
            <p><strong>Game Modes:</strong> ${session.gameModes}</p>
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
        console.error('Error en fetchKeyTesterSessions:', error);
        container.innerHTML = `<div class="error">Error al cargar las sesiones: ${error.message}</div>`;
    }
}

// Función para mostrar testers del pod
async function showPodTesters() {
    const container = document.getElementById("testers-container");
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/testers-in-pod`, {
            headers: { "Authorization": getToken() }
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
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="error">Error al cargar testers: ${error.message}</div>`;
    }
}
// Función para mostrar todos los testers
async function showAllTesters() {
    const container = document.getElementById("testers-container");
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/all-testers`, {
            headers: { "Authorization": getToken() }
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
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="error">Error al cargar testers: ${error.message}</div>`;
    }
}
// Función para ver testers asignados a una sesión específica
async function viewAssignedTesters(sessionId) {
    const container = document.getElementById(`testers-list-${sessionId}`);
    const button = document.getElementById(`view-testers-btn-${sessionId}`);

    // Toggle visibilidad
    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        button.textContent = 'Ver Testers Asignados';
        return;
    }

    container.classList.remove('hidden');
    button.textContent = 'Ocultar Testers Asignados';
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
            headers: { "Authorization": getToken() }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const session = await response.json();

        let html = `
            <div class="assigned-testers-list">
                <h4>Testers Asignados</h4>
                <div class="testers-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Usuario EPAM</th>
                                <th>Dispositivo</th>
                                <th>Capturas</th>
                                <th>Pod</th>
                                <th>Estación</th>
                            </tr>
                        </thead>
                        <tbody>
                            
${session.assignedTesters.map(tester => `
                                <tr>
                                    <td>${tester.Epam_user}</td>
                                    <td>${tester.device}</td>
                                    <td>${tester.capturas.join(', ')}</td>
                                    <td>${tester.pod}</td>
                                    <td>${tester.station}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="error">Error al cargar testers asignados: ${error.message}</div>`;
    }
}
// Función para editar sesión
function editSession(sessionId) {
    window.location.href = `edit_session.html?id=${sessionId}`;
}

// Función para cargar sesiones de tester
async function fetchKeyTesterSessions() {
    const token = getToken();
    if (!token) return;

    const container = document.getElementById("sessions-list");
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/sessions`, {
            headers: { "Authorization": token }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const sessions = await response.json();

        if (sessions.length === 0) {
            container.innerHTML = "<h3>No has creado sesiones aún</h3>";
            return;
        }

        let html = "<h3>Sesiones Creadas</h3>";
        sessions.forEach(session => {
            html += `
            <div class="session-card">
                <div class="session-header">
                    <div class="session-title">${session.backendName} - ${session.startTime}</div>
                    <div class="session-buttons">
                        <button class="action-btn edit-btn" onclick="editSession('${session._id}')">
                            Editar Sesión
                        </button>
                        <button id="view-testers-btn-${session._id}" 
                                class="action-btn view-btn" 
                                onclick="viewAssignedTesters('${session._id}')">
                            Ver Testers Asignados
                        </button>
                    </div>
                </div>
                <div class="session-details">
                    <p><strong>Game Modes:</strong> ${session.gameModes}</p>
                    <p class="id-override"><strong>ID Override:</strong> ${session.idOverride}</p>
                    <p><strong>Total Players:</strong> ${session.totalPlayers}</p>
                    <p><strong>Build:</strong> ${session.buildString}</p>
                    <p><strong>Testers Asignados:</strong> ${session.assignedTesters.length}</p>
                    <p><strong>Fecha:</strong> ${new Date(session.createdAt).toLocaleDateString()}</p>
                </div>
                <div id="testers-list-${session._id}" class="testers-list hidden"></div>
            </div>
        `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('Error en fetchKeyTesterSessions:', error);
        container.innerHTML = `<div class="error">Error al cargar las sesiones: ${error.message}</div>`;
    }
}

// Función para cargar testers del pod
async function fetchTestersInPod() {
    const token = getToken();
    if (!token) return;

    const testerList = document.getElementById("testers-table");
    testerList.innerHTML = '<div class="loading">Cargando testers...</div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/testers-in-pod`, {
            headers: { "Authorization": token }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const testers = await response.json();

        if (testers.length === 0) {
            testerList.innerHTML = "<p>No hay testers en tu pod</p>";
            return;
        }

        let html = "<h3>Testers en tu pod:</h3>";
        html += renderTestersTable(testers);
        testerList.innerHTML = html;
    } catch (error) {
        testerList.innerHTML = `<div class="error">Error al cargar testers: ${error.message}</div>`;
    }
}

// Función para cargar todos los testers
async function fetchAllTesters() {
    const token = getToken();
    if (!token) return;

    const testerList = document.getElementById("testers-table");
    testerList.innerHTML = '<div class="loading">Cargando testers...</div>';

    try {
        const response = await fetch(`${SERVER_URL}/api/all-testers`, {
            headers: { "Authorization": token }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const testers = await response.json();

        if (testers.length === 0) {
            testerList.innerHTML = "<p>No hay testers registrados</p>";
            return;
        }

        let html = "<h3>Todos los testers registrados:</h3>";
        html += renderTestersTable(testers);
        testerList.innerHTML = html;
    } catch (error) {
        testerList.innerHTML = `<div class="error">Error al cargar testers: ${error.message}</div>`;
    }
}

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
                    ${testers.map(tester => `
                        <tr>
                            <td>${tester.Epam_user || ''}</td>
                            <td>${tester.Pod || tester.pod || ''}</td>
                            <td>${tester.Station || tester.station || ''}</td>

                            <td>${tester.Region || tester.region || ''}</td>
                            <td>${Array.isArray(tester.Devices) ? tester.Devices.map(d => d.name).join(', ') : (tester.Devices || '')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
function closeTestersTable() {
    const container = document.getElementById("testers-container");
    container.innerHTML = ""; // Vacía el contenido y oculta la tabla
}