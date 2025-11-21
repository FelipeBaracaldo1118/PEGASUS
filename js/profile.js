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
function getToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No hay token en localStorage");
    return null;
  }
  return token;
}

let currentUser = null;



// === UTILITIES ===
function showError(message) {
  const errorDiv = document.getElementById("error");
  if (errorDiv) errorDiv.textContent = message;
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
}
// === AVATAR UTILITIES ===
const AVATAR_COUNT = 105; // Total de avatares disponibles

// Función para obtener avatar consistente basado en el ID del usuario
function getConsistentAvatar(user) {
  const userId = user._id || user.id || user.Epam_user || '';

  // Generar hash del ID del usuario
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Obtener número de avatar (1-105)
  const avatarNum = (Math.abs(hash) % AVATAR_COUNT) + 1;

  return `/images/avatars/peep-${avatarNum}.png`;
}

// Función alternativa: avatar completamente aleatorio (cambia cada vez)
function getRandomAvatar() {
  const avatarNum = Math.floor(Math.random() * AVATAR_COUNT) + 1;
  return `/images/avatars/peep-${avatarNum}.png`;
}


// === FETCH KEYTESTER SESSIONS ===
async function fetchKeyTesterSessions() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No hay token disponible");
    }

    const response = await fetch(`${SERVER_URL}/api/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const sessions = await response.json();
    const sessionsContainer = document.getElementById("tester-sessions");

    if (!sessions || sessions.length === 0) {
      sessionsContainer.innerHTML = `
        <h3><i class="fas fa-gamepad"></i> Mis Sesiones de Juego</h3>
        <div class="no-sessions">
          <i class="fas fa-inbox"></i>
          <p>No has creado ninguna sesión todavía</p>
          <button class="action-btn create-btn" onclick="window.location.href='/keytester_sessions.html'">
            <i class="fas fa-plus"></i> Crear primera sesión
          </button>
        </div>
      `;
      return;
    }

    let html = `
      <h3><i class="fas fa-gamepad"></i> Mis Sesiones de Juego (${sessions.length})</h3>
      <div class="sessions-grid">
    `;

    sessions.forEach(session => {
      const startDate = new Date(session.startTime);
      const endDate = session.endTime ? new Date(session.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      const now = new Date();

      let statusClass = 'status-upcoming';
      let statusText = 'Próximamente';
      let statusIcon = 'clock';

      if (now >= startDate && now <= endDate) {
        statusClass = 'status-active';
        statusText = 'En curso';
        statusIcon = 'play-circle';
      } else if (now > endDate) {
        statusClass = 'status-finished';
        statusText = 'Finalizada';
        statusIcon = 'check-circle';
      }

      const testersCount = session.assignedTesters?.length || 0;

      html += `
        <div class="session-card ${statusClass}">
          <div class="session-status-badge ${statusClass}">
            <i class="fas fa-${statusIcon}"></i>
            <span>${statusText}</span>
          </div>
          
          <div class="session-header">
            <h4 class="session-title">
              <i class="fas fa-gamepad"></i>
              ${session.backendName || 'Sin nombre'}
            </h4>
          </div>

          <div class="session-body">
            <div class="session-info-grid">
              <div class="info-item">
                <i class="fas fa-calendar-alt"></i>
                <div>
                  <label>Fecha</label>
                  <span>${startDate.toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="fas fa-clock"></i>
                <div>
                  <label>Hora</label>
                  <span>${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="fas fa-users"></i>
                <div>
                  <label>Testers</label>
                  <span>${testersCount}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="fas fa-code-branch"></i>
                <div>
                  <label>Build</label>
                  <span>${session.buildString || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="session-footer">
            <button class="btn-view-details" onclick="viewSessionDetails('${session._id}')">
              <i class="fas fa-eye"></i> Ver detalles
            </button>
            <button class="btn-edit" onclick="editSession('${session._id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteSession('${session._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    sessionsContainer.innerHTML = html;

  } catch (error) {
    console.error('Error al cargar sesiones:', error);
    const sessionsContainer = document.getElementById("tester-sessions");
    sessionsContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar las sesiones: ${error.message}</p>
        <button onclick="fetchKeyTesterSessions()" class="retry-btn">
          <i class="fas fa-sync"></i> Reintentar
        </button>
      </div>
    `;
  }
}
// ============================================
// FETCH TESTER SESSIONS (Para testers normales)
// ============================================
async function fetchTesterSessions() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No hay token disponible");
    }

    const sessionsContainer = document.getElementById("tester-sessions");
    if (!sessionsContainer) {
      throw new Error("Contenedor de sesiones no encontrado");
    }

    // Mostrar loading
    sessionsContainer.innerHTML = `
      <h3><i class="fas fa-calendar-check"></i> Mis Sesiones Asignadas</h3>
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando sesiones...</p>
      </div>
    `;

    // Obtener sesiones
    const response = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    const sessions = await response.json();

    // Mostrar mensaje si no hay sesiones
    if (!sessions || sessions.length === 0) {
      sessionsContainer.innerHTML = `
        <h3><i class="fas fa-calendar-check"></i> Mis Sesiones Asignadas</h3>
        <div class="no-sessions">
          <i class="fas fa-inbox"></i>
          <p>No tienes sesiones asignadas todavía</p>
          <p class="info-text">Espera a que un KeyTester te asigne a una sesión de juego</p>
        </div>
      `;
      return;
    }

    // Renderizar sesiones
    let html = `
      <h3><i class="fas fa-calendar-check"></i> Mis Sesiones Asignadas (${sessions.length})</h3>
      <div class="sessions-grid">
    `;

    sessions.forEach(session => {
      const startDate = new Date(session.startTime);
      const endDate = session.endTime ? new Date(session.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      const now = new Date();

      let statusClass = 'status-upcoming';
      let statusText = 'Próximamente';
      let statusIcon = 'clock';

      if (now >= startDate && now <= endDate) {
        statusClass = 'status-active';
        statusText = 'En curso';
        statusIcon = 'play-circle';
      } else if (now > endDate) {
        statusClass = 'status-finished';
        statusText = 'Finalizada';
        statusIcon = 'check-circle';
      }

      const formattedDate = startDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = startDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const myAssignment = session.assignment || {};
      // Encontrar mi asignación en esta sesión
      // const myAssignment = session.assignedTesters?.find(
      //   tester => tester.testerId.toString() === currentUser._id
      // );

      html += `
        <div class="session-card ${statusClass}">
          <div class="session-status-badge ${statusClass}">
            <i class="fas fa-${statusIcon}"></i>
            <span>${statusText}</span>
          </div>
          
          <div class="session-header">
            <h4 class="session-title">
              <i class="fas fa-gamepad"></i>
              ${session.backendName || 'Sin nombre'}
            </h4>
          </div>

          <div class="session-body">
            <div class="session-info-grid">
              <div class="info-item">
                <i class="fas fa-calendar-alt"></i>
                <div>
                  <label>Fecha</label>
                  <span>${formattedDate}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="fas fa-clock"></i>
                <div>
                  <label>Hora</label>
                  <span>${session.startTime}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="fas fa-gamepad"></i>
                 <div>
    <label>Dispositivo</label>
    <span>${myAssignment.device || myAssignment.dispositivos?.[0] || 'N/A'}</span>
  </div>
              </div>

              <div class="info-item">
                <i class="fas fa-camera"></i>
                <div>
    <label>Capturas</label>
    <span>${myAssignment.capturas && myAssignment.capturas.length > 0 
      ? myAssignment.capturas.join(', ') 
      : 'Ninguna'}</span>
  </div>
              </div>
            </div>

            ${session.buildString ? `
              <div class="session-description">
                <i class="fas fa-info-circle"></i>
                <p><strong>Build:</strong> ${session.buildString}</p>
              </div>
            ` : ''}

            ${session.sessionType && session.sessionType !== 'normal' ? `
              <div class="session-type">
                <i class="fas fa-tag"></i>
                <span>Tipo: ${session.sessionType}</span>
              </div>
            ` : ''}

            ${myAssignment.group ? `
              <div class="session-group">
                <i class="fas fa-users"></i>
                <span>Grupo: ${myAssignment.group}</span>
              </div>
            ` : ''}
          </div>

          <div class="session-footer">
            <button class="btn-view-details" onclick="viewTesterSessionDetails('${session.sessionId}')">
              <i class="fas fa-eye"></i> Ver detalles
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    sessionsContainer.innerHTML = html;

  } catch (error) {
    console.error('Error al cargar sesiones:', error);
    const sessionsContainer = document.getElementById("tester-sessions");
    sessionsContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar las sesiones: ${error.message}</p>
        <button onclick="fetchTesterSessions()" class="retry-btn">
          <i class="fas fa-sync"></i> Reintentar
        </button>
      </div>
    `;
  }
}
function viewTesterSessionDetails(sessionId) {
  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");

  if (!sessionId) {
    console.error('ID de sesión no proporcionado');
    return;
  }

  console.log('Consultando detalles de sesión:', sessionId); // Para debugging

  panel.classList.remove("hidden");
  title.innerHTML = '<i class="fas fa-gamepad"></i> Detalles de la Sesión';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando detalles...</div>';

  fetch(`${SERVER_URL}/api/user/sessions/${sessionId}`, {
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(session => {
      console.log('Datos de la sesión recibidos:', session); // Para debugging

      const startDate = new Date(session.startTime);
      const formattedDate = startDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = startDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const myAssignment = session.assignment || {};

      const validArgs = ["Trace", "LLM", "LWM_BR", "LWM", "Razor", "NoTimeout"];
    let args = [];
    if (myAssignment.capturas && Array.isArray(myAssignment.capturas)) {
      args = myAssignment.capturas.filter(c => validArgs.includes(c));
    }
     const hasLWM = args.includes("LWM") || args.includes("LWM_BR");
      const config = {
      buildIDOverride: session.idOverride,
      backend: session.backendName,
      region: myAssignment.region || 'EU',
      platform: myAssignment.device || 'PC',
      args: args
    };
    const command = window.EpicCommandGenerator ? 
      window.EpicCommandGenerator.generateCommand(config) : 
      'Error: Generador de comandos no disponible';

      content.innerHTML = `
      <div class="session-details">
        <div class="session-header">
          <h3>${session.backendName || 'Sin nombre'}</h3>
          <span class="session-type">${session.sessionType || 'Normal'}</span>
        </div>

        <div class="info-section">
          <h4><i class="fas fa-info-circle"></i> Información General</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>Backend</label>
              <span>${session.backendName || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Build</label>
              <span>${session.buildString || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>ID Override</label>
              <span>${session.idOverride || session.idOverrideA || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Hora</label>
              <span>${session.startTime}</span>
            </div>
          </div>
        </div>

        <div class="assignment-section">
          <h4><i class="fas fa-user-check"></i> Mi Asignación</h4>
          <div class="info-grid">
            <div class="info-item">
             <label>Dispositivo</label>
    <span>${myAssignment.device || myAssignment.dispositivos?.[0] || 'N/A'}</span>
            </div>
            <div class="info-item">
             <label>Capturas</label>
    <span>${myAssignment.capturas && myAssignment.capturas.length > 0 
      ? myAssignment.capturas.join(', ') 
      : 'Ninguna'}</span>
            </div>
            ${myAssignment?.group ? `
              <div class="info-item">
                <label>Grupo</label>
                <span>${myAssignment.group}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${session.buildString ? `
          <div class="build-section">
            <h4><i class="fas fa-code-branch"></i> Build</h4>
            <p>${session.buildString}</p>
          </div>
        ` : ''}
        <!-- ✅ SECCIÓN DE COMANDO -->
        <div class="command-section">
          <h4><i class="fas fa-terminal"></i> Línea de Comando</h4>
          
          <div class="command-controls">
            ${hasLWM ? `
              <button 
                class="toggle-br-btn" 
                id="toggle-br-btn-${sessionId}" 
                onclick="toggleBR('${sessionId}')"
              >
                <i class="fas fa-exchange-alt"></i> BR
              </button>
            ` : ''}
          </div>
          
          <div class="command-box-wrapper">
            <pre id="command-box-${sessionId}" class="command-box">${command}</pre>
            <button 
              class="copy-btn" 
              onclick="copyCommand('${sessionId}')"
            >
              <i class="fas fa-copy"></i> Copiar
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .catch(error => {
      console.error('Error al cargar detalles:', error);
      content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar detalles: ${error.message}</p>
      </div>
    `;
    });
}
// ====================== UTILIDADES DE COMANDO ======================
function toggleBR(sessionId) {
  const commandBox = document.getElementById(`command-box-${sessionId}`);
  const toggleBtn = document.getElementById(`toggle-br-btn-${sessionId}`);
  
  if (!commandBox || !toggleBtn) {
    console.error('Elementos no encontrados');
    return;
  }

  if (!window.lastSessions) {
    console.error('No hay sesiones cargadas');
    return;
  }

  const session = window.lastSessions.find(s => s._id === sessionId || s.sessionId === sessionId);
  if (!session) {
    console.error('Sesión no encontrada en lastSessions');
    return;
  }

  const myAssignment = session.assignment || {};
  
  if (!myAssignment.capturas) {
    console.error('No hay capturas asignadas');
    return;
  }

  let args = [...myAssignment.capturas];
  const isBR = toggleBtn.classList.contains("active");

  // Alternar entre LWM y LWM_BR
  args = args.map(a => {
    if (isBR && a === "LWM_BR") return "LWM";
    if (!isBR && a === "LWM") return "LWM_BR";
    return a;
  });

  toggleBtn.classList.toggle("active");

  const config = {
    buildIDOverride: session.idOverride,
    backend: session.backendName,
    region: myAssignment.region || 'EU',
    platform: myAssignment.device || 'PC',
    args: args
  };

  if (window.EpicCommandGenerator) {
    commandBox.textContent = window.EpicCommandGenerator.generateCommand(config);
  } else {
    console.error('EpicCommandGenerator no disponible');
  }
}

// ====================== UTILIDADES DE COMANDO ======================
function copyCommand(sessionId) {
  const textElem = document.getElementById(`command-box-${sessionId}`);
  if (!textElem) {
    alert("No se encontró el comando a copiar");
    return;
  }

  const textToCopy = textElem.textContent;

  // Método 1: Intentar con Clipboard API (moderno)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        showCopySuccess();
      })
      .catch(err => {
        console.error('Error con Clipboard API:', err);
        fallbackCopyTextToClipboard(textToCopy);
      });
  } else {
    // Método 2: Fallback para navegadores antiguos o HTTP
    fallbackCopyTextToClipboard(textToCopy);
  }

  // Función para mostrar éxito visual
  function showCopySuccess() {
    const copyBtn = event?.target?.closest('.copy-btn');
    if (copyBtn) {
      const originalHTML = copyBtn.innerHTML;
      const originalBg = copyBtn.style.background;
      
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado ✅';
      copyBtn.style.background = '#28a745';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
        copyBtn.style.background = originalBg;
      }, 2000);
    } else {
      // Si no hay botón, mostrar alert
      alert("Comando copiado ✅");
    }
  }

  // Función fallback usando el método antiguo
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Evitar scroll
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showCopySuccess();
      } else {
        alert("No se pudo copiar el comando. Por favor, cópialo manualmente.");
      }
    } catch (err) {
      console.error('Error al copiar:', err);
      alert("Error al copiar. Por favor, cópialo manualmente:\n\n" + text);
    }

    document.body.removeChild(textArea);
  }
}

// ============================================
// VER DETALLES DE SESIÓN (TESTER)
// ============================================
function viewSessionDetails(sessionId) {
  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");

  panel.classList.remove("hidden");
  title.innerHTML = '<i class="fas fa-gamepad"></i> Detalles de la Sesión';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando detalles...</div>';

  fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(session => {
      console.log('Datos de la sesión:', session); // Para debugging

      // Formatear fechas
      const startDate = session.startTime ? new Date(session.startTime) : null;
      const formattedDate = startDate ? startDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A';

      const formattedTime = startDate ? startDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';

      content.innerHTML = `
      <div class="session-details">
        <div class="session-header">
          <h3>${session.backendName || 'Sin nombre'}</h3>
          <span class="session-status">${session.status || 'Finalizada'}</span>
        </div>

        <div class="info-section">
          <h4><i class="fas fa-info-circle"></i> Información General</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>JUEGO</label>
              <span>${session.backendName || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>POD</label>
              <span>${session.pod || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>FECHA DE INICIO</label>
              <span>${formattedDate}</span>
            </div>
            <div class="info-item">
              <label>HORARIO</label>
              <span>${formattedTime}</span>
            </div>
            <div class="info-item">
              <label>DURACIÓN</label>
              <span>${session.duration || 'NaN'} minutos</span>
            </div>
            <div class="info-item">
              <label>TESTERS INSCRITOS</label>
              <span>${session.assignedTesters?.length || 0} / ${testersCount || '∞'}</span>
            </div>
          </div>
        </div>

        ${session.buildString ? `
          <div class="build-section">
            <h4><i class="fas fa-code-branch"></i> Build</h4>
            <p>${session.buildString}</p>
          </div>
        ` : ''}

        ${session.assignedTesters && session.assignedTesters.length > 0 ? `
          <div class="testers-section">
            <h4><i class="fas fa-users"></i> Testers Asignados (${session.assignedTesters.length})</h4>
            <div class="testers-grid">
              ${session.assignedTesters.map(tester => `
                <div class="tester-card">
                  <div class="tester-info">
                    <span class="tester-name">${tester.Epam_user}</span>
                    <span class="tester-device">${tester.device || 'N/A'}</span>
                    ${tester.group ? `<span class="tester-group">Grupo ${tester.group}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="no-testers">
            <i class="fas fa-user-slash"></i>
            <p>Aún no hay testers asignados a esta sesión</p>
          </div>
        `}

        <div class="actions-section">
          <button class="btn-edit" onclick="editSession('${session._id}')">
            <i class="fas fa-edit"></i> Editar sesión
          </button>
          <button class="btn-delete" onclick="deleteSession('${session._id}')">
            <i class="fas fa-trash"></i> Eliminar sesión
          </button>
        </div>
      </div>
    `;
    })
    .catch(error => {
      console.error('Error al cargar detalles:', error);
      content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar detalles: ${error.message}</p>
      </div>
    `;
    });
}

// ============================================
// CANCELAR PARTICIPACIÓN
// ============================================
/*async function cancelSessionParticipation(sessionId) {
  if (!confirm('¿Estás seguro de que deseas cancelar tu participación en esta sesión?')) {
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/leave`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error al cancelar participación');

    alert('Has cancelado tu participación exitosamente');
    
    // Recargar sesiones
    await fetchTesterSessions();

  } catch (error) {
    alert('Error al cancelar participación: ' + error.message);
  }
}*/
// === MAIN PROFILE ===
async function fetchProfile() {
  const token = getToken();
  if (!token) return;

  console.log("=== INICIO fetchProfile ===");

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

  

    const userAvatar = getRandomAvatar();

    let html = `
      <div class="profile-avatar-container">
        <img src="${userAvatar}" alt="${user.Epam_user}" class="profile-avatar" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
      </div>
      <div><label>Usuario EPAM:</label> ${user.Epam_user || "N/A"}</div>
      <div><label>Rol:</label> ${user.userType || (user.isAdmin ? "keytester" : "tester")}</div>
    `;
    document.getElementById("profile-data").innerHTML = html;

    let userInfo = `<span>${user.Epam_user}</span>`;
    document.getElementById("user-info").innerHTML = userInfo;

    // ACTIONS
    if (user.userType === "keytester" || user.isAdmin) {
      //console.log("✅ Usuario es KeyTester, mostrando acciones");

      const actionsHtml = `
    <div class="keytester-actions">
      <button class="action-btn create-btn" onclick="window.location.href='/keytester_sessions.html'">
        <i class="fas fa-plus"></i> Crear sesión de juego
      </button>
      <button class="action-btn view-btn" onclick="showPodTesters()">
        <i class="fas fa-users"></i> Ver testers de mi pod
      </button>
      <button class="action-btn view-btn" onclick="showAllTesters()">
        <i class="fas fa-globe"></i> Ver todos los testers
      </button>
    </div>
  `;
      document.getElementById("profile-actions").innerHTML = actionsHtml;

      console.log("🎮 Llamando a fetchKeyTesterSessions...");

   

      // ✅ Asegurar que el contenedor existe ANTES de llamar la función
      const sessionsContainer = document.getElementById("tester-sessions");
      if (sessionsContainer) {
        console.log("📦 Contenedor tester-sessions encontrado, llamando función...");

        try {
          await fetchKeyTesterSessions();
          console.log("✅ fetchKeyTesterSessions completado");
        } catch (error) {
          console.error("❌ Error en fetchKeyTesterSessions:", error);
        }
      } else {
        console.error("❌ Contenedor tester-sessions no encontrado");
      }

    } else {
      console.log("ℹ️ Usuario es Tester, cargando sesiones de tester");
      await fetchTesterSessions();
    }
  } catch (error) {
    console.error("❌ Error en fetchProfile:", error);
    showError("Error al cargar el perfil: " + error.message);
  }

  console.log("=== FIN fetchProfile ===");
}



// Ver detalles completos de una sesión
function viewSessionDetails(sessionId) {
  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");

  panel.classList.remove("hidden");
  title.innerHTML = '<i class="fas fa-gamepad"></i> Detalles de la Sesión';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando detalles...</div>';

  // Primero, vamos a ver qué datos recibimos
  console.log('Consultando sesión:', sessionId);

  fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(session => {
      // Debug: ver estructura exacta de datos
      console.log('Datos recibidos de la sesión:', session);

      // Formatear fechas con validación
      let formattedDate = 'N/A';
      let formattedTime = 'N/A';
      let duration = 'N/A';

      if (session.startTime) {
        try {
          const startDate = new Date(session.startTime);
          if (!isNaN(startDate.getTime())) {
            formattedDate = startDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            formattedTime = startDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (e) {
          console.error('Error al formatear fecha:', e);
        }
      }

      content.innerHTML = `
      <div class="session-details">
        <div class="session-header">
          <h3>
            <i class="fas fa-gamepad"></i>
            ${session.backendName || 'Sin nombre'}
          </h3>
        </div>

        <div class="info-section">
          <h4 class="section-title">
            <i class="fas fa-info-circle"></i> 
            Información General
          </h4>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Backend</label>
              <span>${session.backendName || 'N/A'}</span>
            </div>

            <div class="info-item">
              <label>Build</label>
              <span>${session.buildString || 'N/A'}</span>
            </div>

            <div class="info-item">
              <label>ID Override</label>
              <span>${session.idOverride || session.idOverrideA || 'N/A'}</span>
            </div>

            <div class="info-item">
              <label>Tipo de Sesión</label>
              <span>${session.sessionType || 'normal'}</span>
            </div>

            <div class="info-item">
              <label>Fecha</label>
              <span>${formattedDate}</span>
            </div>

            <div class="info-item">
              <label>Hora</label>
              <span>${formattedTime}</span>
            </div>

            <div class="info-item">
              <label>Total Jugadores</label>
              <span>${session.totalPlayers || 'No especificado'}</span>
            </div>

            <div class="info-item">
              <label>Testers Asignados</label>
              <span>${session.assignedTesters?.length || 0}</span>
            </div>
          </div>
        </div>

        

        ${session.assignedTesters && session.assignedTesters.length > 0 ? `
          <div class="testers-section">
            <h4 class="section-title">
              <i class="fas fa-users"></i>
              Testers Asignados (${session.assignedTesters.length})
            </h4>
            <div class="testers-grid">
              ${session.assignedTesters.map(tester => `
                <div class="tester-card">
                  <div class="tester-info">
                    <span class="tester-name">${tester.Epam_user || 'Sin nombre'}</span>
                    <span class="tester-details">
                      ${tester.device ? `<span class="device">${tester.device}</span>` : ''}
                      ${tester.group ? `<span class="group">Grupo ${tester.group}</span>` : ''}
                    </span>
                    ${tester.capturas ? `
                      <div class="captures">
                        <small>Capturas: ${tester.capturas.join(', ')}</small>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
                ` : `
          <div class="no-testers">
            <i class="fas fa-user-slash"></i>
            <p>Aún no hay testers asignados a esta sesión</p>
          </div>
        `}

        <div class="actions-section">
          <button class="btn-edit" onclick="editSession('${session._id}')">
            <i class="fas fa-edit"></i> Editar sesión
          </button>
          <button class="btn-delete" onclick="deleteSession('${session._id}')">
            <i class="fas fa-trash"></i> Eliminar sesión
          </button>
          <button class="btn-assign" onclick="window.location.href='asignar_sesion.html?sessionId=${session._id}'">
            <i class="fas fa-user-plus"></i> Asignar Testers
          </button>
        </div>
      </div>
    `;

      // Agregar estilos específicos
      const style = document.createElement('style');
      style.textContent = `
      .session-details {
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .section-title {
        margin-bottom: 15px;
        color: #333;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .info-item {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }

      .info-item label {
        display: block;
        color: #666;
        font-size: 0.9em;
        margin-bottom: 5px;
      }

      .info-item span {
        font-weight: 500;
        color: #333;
      }

      .capture-requirements {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        overflow-x: auto;
      }

      .testers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }

      .tester-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #eee;
      }

      .tester-name {
        font-weight: 500;
        display: block;
        margin-bottom: 5px;
      }

      .tester-details {
        font-size: 0.9em;
        color: #666;
      }

      .device, .group {
        display: inline-block;
        padding: 2px 6px;
        background: #e9ecef;
        border-radius: 4px;
        margin-right: 5px;
        font-size: 0.8em;
      }

      .captures {
        margin-top: 8px;
        font-size: 0.8em;
        color: #666;
      }

      .actions-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
      }

      .btn-edit, .btn-delete, .btn-assign {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .btn-edit {
        background: #007bff;
        color: white;
      }

      .btn-delete {
        background: #dc3545;
        color: white;
      }

      .btn-assign {
        background: #28a745;
        color: white;
      }

      .no-testers {
        text-align: center;
        padding: 30px;
        background: #f8f9fa;
        border-radius: 6px;
        color: #666;
      }

      .no-testers i {
        font-size: 2em;
        margin-bottom: 10px;
        color: #999;
      }
    `;
      document.head.appendChild(style);
    })
    .catch(error => {
      console.error('Error al cargar detalles:', error);
      content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar detalles: ${error.message}</p>
        <button onclick="viewSessionDetails('${sessionId}')" class="retry-btn">
          <i class="fas fa-sync"></i> Reintentar
        </button>
      </div>
    `;
    });
}

// Eliminar sesión
async function deleteSession(sessionId) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
    return;
  }

  const token = getToken();

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error al eliminar la sesión');

    alert('Sesión eliminada exitosamente');

    // Cerrar panel si está abierto
    const panel = document.getElementById("dynamic-panel");
    if (panel && !panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
    }

    // Recargar sesiones
    await fetchKeyTesterSessions();

  } catch (error) {
    alert('Error al eliminar sesión: ' + error.message);
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

// === SEARCH FUNCTIONALITY ===
let searchTimeout;
const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("input", function (e) {
    const query = e.target.value.trim();

    // Limpiar timeout anterior
    clearTimeout(searchTimeout);

    // Si está vacío, cerrar panel
    if (query.length === 0) {
      return;
    }

    // Esperar 500ms después de que el usuario deje de escribir
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 500);
  });
}

// Función para realizar la búsqueda
async function performSearch(query) {
  const token = getToken();
  if (!token) return;

  const panel = document.getElementById("dynamic-panel");
  const title = document.getElementById("panel-title");
  const content = document.getElementById("dynamic-content");

  // Abrir panel y mostrar loading
  panel.classList.remove("hidden");
  title.innerHTML = `<i class="fas fa-search"></i> Resultados de búsqueda: "${query}"`;
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

  try {
    const response = await fetch(`${SERVER_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const users = await response.json();

    // Separar por tipo de usuario
    const testers = users.filter(u => u.userType === 'tester');
    const keytesters = users.filter(u => u.userType === 'keytester' || u.isAdmin);

    displaySearchResultsInPanel({ testers, keytesters }, query);

  } catch (error) {
    console.error("Error en búsqueda:", error);
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al buscar: ${error.message}</p>
      </div>
    `;
  }
}

function displaySearchResultsInPanel(results, query) {
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");

  title.innerHTML = `<i class="fas fa-search"></i> Resultados de búsqueda: "${query}"`;

  if (results.testers.length === 0 && results.keytesters.length === 0) {
    content.innerHTML = `
      <div class="no-results-panel">
        <i class="fas fa-search"></i>
        <h3>No se encontraron resultados</h3>
        <p>No hay usuarios que coincidan con "${query}"</p>
      </div>
    `;
    return;
  }

  let html = `<div class="search-results-panel">`;

  // Resultados de KeyTesters
  if (results.keytesters.length > 0) {
    html += `
      <div class="results-section">
        <div class="section-header">
          <h3 class="section-title">
            <i class="fas fa-user-shield"></i> KeyTesters
          </h3>
          <span class="count-badge">${results.keytesters.length}</span>
        </div>
        <div class="cards-container">
    `;

    results.keytesters.forEach(kt => {
      const devices = Array.isArray(kt.Devices)
        ? kt.Devices.map(d => d.name).join(", ")
        : "Sin dispositivos";

      // 🔹 Obtener avatar consistente
      const avatarImg = getRandomAvatar();

      html += `
        <div class="user-card keytester-card" onclick="showUserDetails('${kt._id}')">
          <div class="card-ribbon keytester-ribbon">
            <i class="fas fa-crown"></i> KeyTester
          </div>
          
          <div class="card-avatar keytester-avatar">
            <img src="${avatarImg}" alt="${kt.Epam_user}" class="avatar-img" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
          </div>
          
          <div class="card-content">
            <h4 class="user-name">${kt.Epam_user}</h4>
            
            <div class="user-details">
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span><strong>${kt.Pod}</strong> - ${kt.Station}</span>
              </div>
              
              <div class="detail-item">
                <i class="fas fa-globe"></i>
                <span>${kt.Region}</span>
              </div>
              
              ${devices !== "Sin dispositivos" ? `
                <div class="detail-item devices-item">
                  <i class="fas fa-gamepad"></i>
                  <span class="devices-list">${devices}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="card-footer">
            <button class="view-details-btn">
              Ver detalles <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  // Resultados de Testers
  if (results.testers.length > 0) {
    html += `
      <div class="results-section">
        <div class="section-header">
          <h3 class="section-title">
            <i class="fas fa-users"></i> Testers
          </h3>
          <span class="count-badge">${results.testers.length}</span>
        </div>
        <div class="cards-container">
    `;

    results.testers.forEach(tester => {
      const devices = Array.isArray(tester.Devices)
        ? tester.Devices.map(d => d.name).join(", ")
        : "Sin dispositivos";

      const statusIcon = tester.IsPlaying ? "play-circle" : "check-circle";
      const statusClass = tester.IsPlaying ? "status-playing" : "status-available";
      const statusText = tester.IsPlaying ? "Jugando" : "Disponible";

      // 🔹 Obtener avatar consistente
      const avatarImg = getRandomAvatar();

      html += `
        <div class="user-card tester-card" onclick="showUserDetails('${tester._id}')">
          <div class="card-status ${statusClass}">
            <i class="fas fa-${statusIcon}"></i>
            <span>${statusText}</span>
          </div>
          
          <div class="card-avatar tester-avatar">
            <img src="${avatarImg}" alt="${tester.Epam_user}" class="avatar-img" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
          </div>
          
          <div class="card-content">
            <h4 class="user-name">${tester.Epam_user}</h4>
            
            <div class="user-details">
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span><strong>${tester.Pod}</strong> - ${tester.Station}</span>
              </div>
              
              <div class="detail-item">
                <i class="fas fa-globe"></i>
                <span>${tester.Region}</span>
              </div>
              
              ${devices !== "Sin dispositivos" ? `
                <div class="detail-item devices-item">
                  <i class="fas fa-gamepad"></i>
                  <span class="devices-list">${devices}</span>
                </div>
              ` : ''}
              
              ${tester.availability ? `
                <div class="detail-item">
                  <i class="fas fa-clock"></i>
                  <span>${tester.availability}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="card-footer">
            <button class="view-details-btn">
              Ver detalles <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  html += `</div>`;
  content.innerHTML = html;
}
// Cerrar panel lateral
const closePanel = document.getElementById("close-panel");
if (closePanel) {
  closePanel.addEventListener("click", function () {
    document.getElementById("dynamic-panel").classList.add("hidden");
    searchInput.value = ""; // Limpiar búsqueda
  });
}
function showUserDetails(userId) {
  const token = getToken();
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");

  title.innerHTML = '<i class="fas fa-user"></i> Detalles del Usuario';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando información...</div>';

  fetch(`${SERVER_URL}/api/users/search?q=${userId}`, {
    headers: { Authorization: token }
  })
    .then(res => res.json())
    .then(users => {
      const user = users.find(u => u._id === userId) || users[0];

      if (!user) {
        content.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>Usuario no encontrado</p></div>';
        return;
      }

      const devices = Array.isArray(user.Devices)
        ? user.Devices.map(d => `
            <div class="device-item">
              <span class="device-name">${d.name}</span>
              <span class="device-priority">Prioridad ${d.priority}</span>
            </div>
          `).join("")
        : "<p>Sin dispositivos</p>";

      const statusIcon = user.IsPlaying ? 'play-circle' : 'check-circle';
      const statusClass = user.IsPlaying ? 'status-playing' : 'status-available';
      const statusText = user.IsPlaying ? 'Jugando' : 'Disponible';

      // 🔹 Obtener avatar consistente
      const avatarImg = getRandomAvatar();

      content.innerHTML = `
        <div class="user-details-panel">
          <div class="details-header">
            <div class="user-avatar-large">
              <img src="${avatarImg}" alt="${user.Epam_user}" class="avatar-img-large" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
            </div>
            <h2>${user.Epam_user}</h2>
            <span class="user-badge">${user.userType === 'keytester' ? 'KeyTester' : 'Tester'}</span>
            <span class="user-status ${statusClass}">
              <i class="fas fa-${statusIcon}"></i> ${statusText}
            </span>
          </div>
          
          <div class="details-body">
            <div class="detail-section">
              <h4><i class="fas fa-info-circle"></i> Información General</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Pod</label>
                  <span>${user.Pod}</span>
                </div>
                <div class="detail-item">
                  <label>Estación</label>
                  <span>${user.Station}</span>
                </div>
                <div class="detail-item">
                  <label>Región</label>
                  <span>${user.Region}</span>
                </div>
                ${user.availability ? `
                  <div class="detail-item">
                    <label>Disponibilidad</label>
                    <span>${user.availability}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="detail-section">
              <h4><i class="fas fa-gamepad"></i> Dispositivos</h4>
              <div class="devices-grid">
                ${devices}
              </div>
            </div>
            
            <div class="detail-actions">
              <button class="btn-back" onclick="performSearch('${searchInput.value}')">
                <i class="fas fa-arrow-left"></i> Volver a resultados
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .catch(error => {
      content.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>Error al cargar detalles: ${error.message}</p></div>`;
    });
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



let profileLoaded = false;

async function initProfile() {
  if (profileLoaded) {
    console.log("⚠️ Profile ya fue cargado, ignorando...");
    return;
  }

  profileLoaded = true;
  console.log("🚀 Iniciando carga de perfil...");

  // Esperar un momento para asegurar que el DOM esté completamente listo
  await new Promise(resolve => setTimeout(resolve, 100));

  // Verificar que los contenedores existan
  const profileData = document.getElementById("profile-data");
  const profileActions = document.getElementById("profile-actions");
  const testerSessions = document.getElementById("tester-sessions");

  console.log("📦 Contenedores encontrados:", {
    profileData: !!profileData,
    profileActions: !!profileActions,
    testerSessions: !!testerSessions
  });

  if (!profileData || !profileActions || !testerSessions) {
    console.error("❌ Faltan contenedores en el DOM");
    setTimeout(initProfile, 500); // Reintentar en 500ms
    return;
  }

  await fetchProfile();
}

// Método 1: DOMContentLoaded
if (document.readyState === 'loading') {
  console.log("📝 DOM aún cargando, esperando DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", initProfile);
} else {
  console.log("📝 DOM ya está listo, ejecutando inmediatamente...");
  initProfile();
}

// Método 2: window.onload (backup)
window.addEventListener('load', () => {
  console.log("🔄 window.load disparado");
  if (!profileLoaded) {
    console.log("⚠️ Profile no se cargó con DOMContentLoaded, intentando ahora...");
    initProfile();
  }
});

// Método 3: Timeout de seguridad
setTimeout(() => {
  if (!profileLoaded) {
    console.log("⏰ Timeout de seguridad (1s) - forzando carga");
    initProfile();
  }
}, 1000);

console.log("✅ Listeners de inicialización registrados");
