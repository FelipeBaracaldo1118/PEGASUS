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
  console.log("🎮 Cargando sesiones de KeyTester...");

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
    console.log("✅ Sesiones cargadas:", sessions);

    // Guardar sesiones globalmente
    window.lastSessions = sessions;

    // Mostrar el contenedor de sesiones
    const sessionsContainer = document.getElementById("sessions-list-container");
    if (sessionsContainer) {
      sessionsContainer.style.display = 'block';
    }

    // Renderizar lista de sesiones en la columna izquierda
    renderKeyTesterSessionsList(sessions);

  } catch (error) {
    console.error('❌ Error al cargar sesiones:', error);
    const sessionsList = document.getElementById("sessions-list");
    if (sessionsList) {
      sessionsList.innerHTML = `
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
}
// ============================================
// RENDERIZAR LISTA DE SESIONES (KeyTester - Columna izquierda)
// ============================================
function renderKeyTesterSessionsList(sessions) {
  const sessionsList = document.getElementById("sessions-list");

  if (!sessionsList) {
    console.error("❌ No se encontró sessions-list");
    return;
  }

  if (!sessions || sessions.length === 0) {
    sessionsList.innerHTML = `
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

  let html = '';

  sessions.forEach(session => {
    // ✅ Validar y parsear fecha correctamente
    let startDate;
    try {
      startDate = new Date(session.startTime);
      if (isNaN(startDate.getTime())) {
        console.warn(`Fecha inválida para sesión ${session._id}:`, session.startTime);
        startDate = new Date(); // Fecha actual como fallback
      }
    } catch (e) {
      console.error('Error al parsear fecha:', e);
      startDate = new Date();
    }

    const endDate = session.endTime ? new Date(session.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const now = new Date();

    let statusClass = 'status-upcoming';
    let statusIcon = 'clock';
    let statusText = 'Próxima';

    if (now >= startDate && now <= endDate) {
      statusClass = 'status-active';
      statusIcon = 'play-circle';
      statusText = 'En curso';
    } else if (now > endDate) {
      statusClass = 'status-finished';
      statusIcon = 'check-circle';
      statusText = 'Finalizada';
    }

    const testersCount = session.assignedTesters?.length || 0;
    const sessionId = session._id || session.sessionId;

    // ✅ Formatear fecha y hora
    const formattedDate = startDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });

    const formattedTime = startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    html += `
      <div class="session-item ${statusClass}" onclick="viewSessionDetails('${sessionId}')">
        <div class="session-item-header">
          <div class="session-status-indicator ${statusClass}">
            <i class="fas fa-${statusIcon}"></i>
          </div>
          <div class="session-item-info">
            <h4 class="session-item-title">${session.backendName || 'Sin nombre'}</h4>
            <div class="session-item-meta">
              <span class="session-date">
                <i class="fas fa-calendar"></i>
                ${formattedDate}
              </span>
              <span class="session-time">
                <i class="fas fa-clock"></i>
                ${formattedTime}
              </span>
            </div>
          </div>
        </div>
        
        <div class="session-item-footer">
          <span class="session-testers-count">
            <i class="fas fa-users"></i>
            ${testersCount} ${testersCount === 1 ? 'tester' : 'testers'}
          </span>
          <span class="session-status-text ${statusClass}">
            ${statusText}
          </span>
        </div>
        
        <div class="session-item-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
  });

  sessionsList.innerHTML = html;
}
// ============================================
// VER DETALLES DE SESIÓN (PANEL DERECHO)
// ============================================
function viewKeyTesterSessionDetails(sessionId) {
  // Marcar sesión activa en la lista
  document.querySelectorAll('.session-item-compact').forEach(item => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`[data-session-id="${sessionId}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  // Buscar la sesión
  const session = window.lastSessions?.find(s => (s._id || s.sessionId) === sessionId);

  if (!session) {
    showError("Sesión no encontrada");
    return;
  }

  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const closeBtn = document.getElementById("close-panel");

  // Mostrar botón de cerrar
  closeBtn.style.display = 'flex';

  // Actualizar título
  title.innerHTML = `<i class="fas fa-info-circle"></i> ${session.backendName || 'Detalles de la Sesión'}`;

  const startDate = new Date(session.startTime);
  const endDate = session.endTime ? new Date(session.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();

  let statusClass = 'status-upcoming';
  let statusText = 'Próximamente';

  if (now >= startDate && now <= endDate) {
    statusClass = 'status-active';
    statusText = 'En curso';
  } else if (now > endDate) {
    statusClass = 'status-finished';
    statusText = 'Finalizada';
  }

  content.innerHTML = `
    <div class="session-details">
      <!-- Header -->
      <div class="session-header">
        <h3>${session.backendName || 'Sin nombre'}</h3>
        <span class="session-type-badge">${session.sessionType || 'N/A'}</span>
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <h4><i class="fas fa-info-circle"></i> Información General</h4>
        <div class="info-grid">
          <div class="info-item">
            <label>Fecha</label>
            <span>${startDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })}</span>
          </div>
          <div class="info-item">
            <label>Hora de inicio</label>
            <span>${session.startTime || startDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })}</span>
          </div>
          <div class="info-item">
            <label>Estado</label>
            <span class="session-status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="info-item">
            <label>Testers asignados</label>
            <span>${session.assignedTesters?.length || 0}</span>
          </div>
          ${session.description ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <label>Descripción</label>
              <span>${session.description}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Build Section -->
      ${session.buildString ? `
        <div class="build-section">
          <h4><i class="fas fa-code-branch"></i> Build String</h4>
          <div class="build-string">${session.buildString}</div>
        </div>
      ` : ''}

      <!-- Testers Section -->
     ${session.assignedTesters && session.assignedTesters.length > 0 ? `
  <div class="testers-section">
    <h4 class="section-title">
      <i class="fas fa-users"></i>
      Testers Asignados (${session.assignedTesters.length})
    </h4>
    <div class="testers-grid-enhanced">
      ${session.assignedTesters.map(tester => {
    const testerId = tester.Epam_user || tester.testerId || tester._id;
    const testerAvatar = getRandomAvatar();

    // Estado de instalación
    const installStatus = tester.StateOfInstalling || 'no instalado';
    let installBadge = '';
    let installIcon = '';

    if (installStatus === 'instalado') {
      installBadge = 'status-installed';
      installIcon = 'check-circle';
    } else if (installStatus === 'instalando') {
      installBadge = 'status-installing';
      installIcon = 'spinner fa-spin';
    } else {
      installBadge = 'status-not-installed';
      installIcon = 'times-circle';
    }

    // Estado de juego
    const isPlaying = tester.IsPlaying === true;
    const playingBadge = isPlaying ? 'status-playing' : 'status-available';
    const playingIcon = isPlaying ? 'gamepad' : 'circle';
    const playingText = isPlaying ? 'Jugando' : 'Disponible';

    return `
          <div class="tester-card-enhanced">
            <!-- Avatar y nombre -->
            <div class="tester-card-header">
              <div class="tester-avatar-wrapper">
                <img src="${testerAvatar}" alt="${testerId}" class="tester-avatar-small" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
                <div class="tester-status-indicator ${playingBadge}">
                  <i class="fas fa-${playingIcon}"></i>
                </div>
              </div>
              <div class="tester-info-header">
                <h5 class="tester-name">${testerId}</h5>
                <span class="tester-playing-status ${playingBadge}">
                  <i class="fas fa-${playingIcon}"></i>
                  ${playingText}
                </span>
              </div>
            </div>

            <!-- Información del tester -->
            <div class="tester-card-body">
              <!-- Dispositivo -->
              ${tester.device ? `
                <div class="tester-info-row">
                  <i class="fas fa-mobile-alt"></i>
                  <span class="device-badge">${tester.device}</span>
                </div>
              ` : ''}

              <!-- Grupo -->
              ${tester.group ? `
                <div class="tester-info-row">
                  <i class="fas fa-layer-group"></i>
                  <span>Grupo ${tester.group}</span>
                </div>
              ` : ''}

              <!-- Capturas -->
              ${tester.capturas && tester.capturas.length > 0 ? `
                <div class="tester-info-row">
                  <i class="fas fa-camera"></i>
                  <div class="captures-list">
                    ${tester.capturas.map(cap => `
                      <span class="capture-tag">${cap}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Estado de instalación -->
              <div class="tester-info-row">
                <i class="fas fa-download"></i>
                <span class="install-status ${installBadge}">
                  <i class="fas fa-${installIcon}"></i>
                  ${installStatus.charAt(0).toUpperCase() + installStatus.slice(1)}
                </span>
              </div>

              <!-- Ubicación -->
              ${tester.Pod || tester.Station ? `
                <div class="tester-info-row">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${tester.Pod || 'N/A'} - ${tester.Station || 'N/A'}</span>
                </div>
              ` : ''}
            </div>

            <!-- Acciones -->
            <div class="tester-card-actions">
              <button 
                class="btn-replace-auto" 
                onclick="replaceTesterFromSession('${session._id}', '${testerId}')"
                title="Reemplazo automático"
              >
                <i class="fas fa-sync-alt"></i>
                Reemplazo Auto
              </button>
              <button 
                class="btn-replace-manual" 
                onclick="openManualReplaceModal('${session._id}', '${testerId}', '${tester.device || ''}')"
                title="Elegir reemplazo manualmente"
              >
                <i class="fas fa-user-edit"></i>
                Reemplazo Manual
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  </div>
` : `
  <div class="no-testers">
    <i class="fas fa-user-slash"></i>
    <p>Aún no hay testers asignados a esta sesión</p>
  </div>
`}

      <!-- Command Section -->
      ${session.buildString ? `
        <div class="command-section">
          <h4><i class="fas fa-terminal"></i> Comando de Instalación</h4>
          <div class="command-controls">
            <button class="toggle-br-btn" onclick="toggleLineBreaks(this)">
              <i class="fas fa-align-left"></i> Alternar saltos de línea
            </button>
          </div>
          <div class="command-box-wrapper">
            <pre class="command-box" id="command-output">${session.buildString}</pre>
            <button class="copy-btn" onclick="copyCommand()">
              <i class="fas fa-copy"></i> Copiar
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="detail-actions">
        <button class="btn-edit" onclick="window.location.href='/keytester_sessions.html?edit=${sessionId}'">
          <i class="fas fa-edit"></i> Editar sesión
        </button>
        <button class="btn-delete-detail" onclick="deleteSession('${sessionId}')">
          <i class="fas fa-trash"></i> Eliminar sesión
        </button>
      </div>
    </div>
  `;
}

// ============================================
// MODAL DE REEMPLAZO MANUAL
// ============================================
async function openManualReplaceModal(sessionId, currentTesterId, device) {
  console.log('🔍 Abriendo modal de reemplazo:', { sessionId, currentTesterId, device });
  
  const token = getToken();
  
  if (!token) {
    alert('No hay token de autenticación');
    return;
  }
  
  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'replace-modal';
  
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-user-edit"></i>
          Reemplazar Tester
        </h3>
        <button class="modal-close" onclick="closeReplaceModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="replace-info">
          <p><strong>Tester actual:</strong> ${currentTesterId}</p>
          ${device ? `<p><strong>Dispositivo:</strong> ${device}</p>` : ''}
        </div>
        
        <div class="loading-testers">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Cargando testers disponibles...</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cargar testers disponibles
  try {
    console.log('📡 Solicitando testers disponibles...');
    
    // ✅ CAMBIO: Incluir sessionId en la URL
    const params = new URLSearchParams();
    if (device) params.append('device', device);
    params.append('sessionId', sessionId); // ← NUEVO
    
    const url = `${SERVER_URL}/api/testers-available?${params.toString()}`;
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Respuesta del servidor:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const testers = await response.json();
    console.log('✅ Testers recibidos:', testers);
    
    // Filtrar el tester actual (por si acaso)
    const availableTesters = testers.filter(t => {
      const testerId = t.Epam_user || t._id || t.testerId;
      return testerId !== currentTesterId;
    });
    
    console.log('📋 Testers disponibles (filtrados):', availableTesters.length);
    
    renderAvailableTesters(availableTesters, sessionId, currentTesterId, device);
    
  } catch (error) {
    console.error('❌ Error al cargar testers:', error);
    
    const modalBody = document.querySelector('#replace-modal .modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="replace-info">
          <p><strong>Tester actual:</strong> ${currentTesterId}</p>
          ${device ? `<p><strong>Dispositivo:</strong> ${device}</p>` : ''}
        </div>
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error al cargar testers: ${error.message}</p>
          <button class="retry-btn" onclick="openManualReplaceModal('${sessionId}', '${currentTesterId}', '${device || ''}')">
            <i class="fas fa-sync"></i> Reintentar
          </button>
        </div>
      `;
    }
  }
}

// Renderizar lista de testers disponibles
function renderAvailableTesters(testers, sessionId, currentTesterId, requiredDevice) {
  const modalBody = document.querySelector('#replace-modal .modal-body');
  
  if (!modalBody) {
    console.error('❌ No se encontró el modal body');
    return;
  }
  
  if (!testers || testers.length === 0) {
    modalBody.innerHTML = `
      <div class="replace-info">
        <p><strong>Tester actual:</strong> ${currentTesterId}</p>
        ${requiredDevice ? `<p><strong>Dispositivo requerido:</strong> ${requiredDevice}</p>` : ''}
      </div>
      <div class="no-testers">
        <i class="fas fa-user-slash"></i>
        <p>No hay testers disponibles para reemplazo</p>
        <small>Todos los testers están asignados a esta sesión</small>
      </div>
    `;
    return;
  }
  
  // Ordenar testers: primero los que tienen el dispositivo requerido
  const sortedTesters = [...testers].sort((a, b) => {
    if (!requiredDevice) return 0;
    
    const aHasDevice = a.Devices && a.Devices.some(d => d.name === requiredDevice);
    const bHasDevice = b.Devices && b.Devices.some(d => d.name === requiredDevice);
    
    if (aHasDevice && !bHasDevice) return -1;
    if (!aHasDevice && bHasDevice) return 1;
    return 0;
  });
  
  const testersHTML = sortedTesters.map(tester => {
    const hasRequiredDevice = requiredDevice && tester.Devices && 
                              tester.Devices.some(d => d.name === requiredDevice);
    
    const devices = tester.Devices && tester.Devices.length > 0
      ? tester.Devices.map(d => d.name).join(', ')
      : 'Sin dispositivos';
    
    let deviceBadge = '';
    let warningMessage = '';
    
    if (requiredDevice) {
      if (hasRequiredDevice) {
        deviceBadge = '<span class="device-badge device-match">✓ Dispositivo compatible</span>';
      } else {
        deviceBadge = '<span class="device-badge device-mismatch">⚠ Dispositivo diferente</span>';
        warningMessage = `<small class="warning-text">⚠️ Este tester no tiene ${requiredDevice}, pero puedes asignarlo de todas formas</small>`;
      }
    }
    
    // ✅ CAMBIO: Usar IsPlaying (mayúscula) del backend
    let installBadge = '';
    if (tester.StateOfInstalling === 'instalado') {
      installBadge = '<span class="status-badge status-installed">✓ Instalado</span>';
    } else if (tester.StateOfInstalling === 'instalando') {
      installBadge = '<span class="status-badge status-installing">⏳ Instalando</span>';
    } else {
      installBadge = '<span class="status-badge status-not-installed">✗ No instalado</span>';
    }
    
    // ✅ CAMBIO: Usar IsPlaying (mayúscula)
    let playingBadge = '';
    if (tester.IsPlaying === true) {  // Cambio aquí
      playingBadge = '<span class="status-badge status-playing">🎮 Jugando</span>';
    }
    
    return `
      <div class="tester-option ${hasRequiredDevice ? 'recommended' : 'alternative'}" 
           data-tester-id="${tester._id}" 
           data-tester-name="${tester.Epam_user}">
        
        <div class="tester-header">
          <div class="tester-name">
            <i class="fas fa-user"></i>
            <strong>${tester.Epam_user}</strong>
            ${hasRequiredDevice ? '<i class="fas fa-star recommended-icon" title="Recomendado"></i>' : ''}
          </div>
          <div class="tester-badges">
            ${deviceBadge}
            ${installBadge}
            ${playingBadge}
          </div>
        </div>
        
        <div class="tester-details">
          <div class="detail-row">
            <span class="detail-label">
              <i class="fas fa-gamepad"></i> Dispositivos:
            </span>
            <span class="detail-value">${devices}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">
              <i class="fas fa-map-marker-alt"></i> Ubicación:
            </span>
            <span class="detail-value">${tester.Pod || 'N/A'} - ${tester.Station || 'N/A'}</span>
          </div>
          
          ${tester.Region ? `
            <div class="detail-row">
              <span class="detail-label">
                <i class="fas fa-globe"></i> Región:
              </span>
              <span class="detail-value">${tester.Region}</span>
            </div>
          ` : ''}
          
          ${tester.Mmr ? `
            <div class="detail-row">
              <span class="detail-label">
                <i class="fas fa-trophy"></i> MMR:
              </span>
              <span class="detail-value">${tester.Mmr}</span>
            </div>
          ` : ''}
        </div>
        
        ${warningMessage ? `<div class="warning-message">${warningMessage}</div>` : ''}
        
        <button class="select-tester-btn" 
                onclick="confirmManualReplacement('${sessionId}', '${currentTesterId}', '${tester.Epam_user}')">
          <i class="fas fa-check"></i>
          Seleccionar
        </button>
      </div>
    `;
  }).join('');
  
  modalBody.innerHTML = `
    <div class="replace-info">
      <p><strong>Tester actual:</strong> ${currentTesterId}</p>
      ${requiredDevice ? `<p><strong>Dispositivo requerido:</strong> ${requiredDevice}</p>` : ''}
    </div>
    
    <div class="search-container">
      <i class="fas fa-search"></i>
      <input 
        type="text" 
        id="search-replacement" 
        placeholder="Buscar tester por nombre..." 
        oninput="filterReplacementTesters()"
        autocomplete="off"
      />
    </div>
    
    <div class="testers-list">
      ${testersHTML}
    </div>
    
    <div class="modal-footer">
      <p class="testers-count">
        <i class="fas fa-users"></i>
        ${testers.length} tester${testers.length !== 1 ? 's' : ''} disponible${testers.length !== 1 ? 's' : ''}
      </p>
    </div>
  `;
}

// ============================================
// FILTRAR TESTERS EN EL MODAL
// ============================================
function filterReplacementTesters() {
  const searchInput = document.getElementById('search-replacement');
  
  if (!searchInput) {
    console.error('❌ Input de búsqueda no encontrado');
    return;
  }
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const testerOptions = document.querySelectorAll('.tester-option');
  
  console.log('🔍 Buscando:', searchTerm);
  console.log('📋 Total de testers:', testerOptions.length);
  
  let visibleCount = 0;
  
  testerOptions.forEach(option => {
    // Obtener el nombre del tester desde el atributo data
    const testerName = (option.getAttribute('data-tester-name') || '').toLowerCase();
    const testerId = (option.getAttribute('data-tester-id') || '').toLowerCase();
    
    // También buscar en el contenido visible
    const testerContent = option.textContent.toLowerCase();
    
    // Verificar si coincide con alguno de los criterios
    const matches = 
      searchTerm === '' ||
      testerName.includes(searchTerm) ||
      testerId.includes(searchTerm) ||
      testerContent.includes(searchTerm);
    
    if (matches) {
      option.style.display = 'block';
      visibleCount++;
    } else {
      option.style.display = 'none';
    }
  });
  
  console.log(`✅ Testers visibles: ${visibleCount} de ${testerOptions.length}`);
  
  // Mostrar/ocultar mensaje de "no hay resultados"
  const testersList = document.querySelector('.testers-list');
  let noResultsMsg = document.getElementById('no-results-message');
  
  if (visibleCount === 0 && searchTerm !== '') {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.id = 'no-results-message';
      noResultsMsg.className = 'no-results';
      noResultsMsg.innerHTML = `
        <i class="fas fa-search"></i>
        <p>No se encontraron testers con "${searchTerm}"</p>
        <small>Intenta con otro término de búsqueda</small>
      `;
      testersList.appendChild(noResultsMsg);
    }
  } else {
    if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }
  
  // Actualizar contador en el footer
  const testersCount = document.querySelector('.testers-count');
  if (testersCount) {
    testersCount.innerHTML = `
      <i class="fas fa-users"></i>
      ${visibleCount} tester${visibleCount !== 1 ? 's' : ''} ${searchTerm ? 'encontrado' + (visibleCount !== 1 ? 's' : '') : 'disponible' + (visibleCount !== 1 ? 's' : '')}
    `;
  }
}

// ============================================
// CONFIRMAR REEMPLAZO MANUAL
// ============================================
async function confirmManualReplacement(sessionId, currentTesterId, newTesterId) {
  if (!confirm(`¿Confirmar reemplazo de ${currentTesterId} por ${newTesterId}?`)) {
    return;
  }
  
  const token = getToken();
  
  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/replace-tester`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentTesterId: currentTesterId,
        newTesterId: newTesterId
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(`✅ ${data.message}\n\nAnterior: ${data.oldTester.Epam_user}\nNuevo: ${data.newTester.Epam_user}`);
      
      // ✅ NUEVO: Cerrar modal y recargar vista
      closeReplaceModal();
      
      // Recargar la vista de la sesión
      await viewSessionDetails(sessionId);
      
      // ✅ OPCIONAL: Mostrar notificación de éxito
      showNotification('Tester reemplazado exitosamente', 'success');
      
    } else {
      alert(`❌ Error: ${data.error || data.message}`);
    }
    
  } catch (error) {
    console.error('Error al confirmar reemplazo:', error);
    alert('Error al reemplazar tester');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// CERRAR MODAL DE REEMPLAZO
// ============================================
function closeReplaceModal() {
  const modal = document.getElementById('replace-modal');
  if (modal) {
    modal.remove();
  }
}
// ============================================
// CERRAR PANEL Y VOLVER A LA LISTA
// ============================================
const closePanelBtn = document.getElementById("close-panel");
if (closePanelBtn) {
  closePanelBtn.addEventListener("click", function () {
    console.log("🔙 Cerrando panel de detalles");

    if (currentUser) {
      if (currentUser.userType === "keytester" || currentUser.isAdmin) {
        // Para KeyTesters: limpiar selección y mostrar estado vacío
        document.querySelectorAll('.session-item-compact').forEach(item => {
          item.classList.remove('active');
        });

        const content = document.getElementById("dynamic-content");
        const title = document.getElementById("panel-title");
        const closeBtn = document.getElementById("close-panel");

        if (closeBtn) closeBtn.style.display = 'none';
        if (title) title.innerHTML = 'Detalles';

        if (content) {
          content.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-hand-pointer"></i>
              <p>Selecciona una sesión para ver los detalles</p>
            </div>
          `;
        }
      } else {
        // Para Testers: volver a la lista de sesiones
        fetchTesterSessions();
      }
    }
  });
}
// ============================================
// FETCH TESTER SESSIONS (Para Testers normales)
// ============================================
async function fetchTesterSessions() {
  console.log("🎮 Cargando sesiones de Tester...");

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No hay token disponible");
    }

    // ✅ Usar el endpoint correcto
    const response = await fetch(`${SERVER_URL}/api/user/my-sessions`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    // ✅ Capturar el error del servidor
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Error del servidor:", errorData);
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    const sessions = await response.json();
    console.log("✅ Sesiones del tester cargadas:", sessions);

    // Guardar sesiones globalmente
    window.lastSessions = sessions;

    // Renderizar en el panel dinámico (diseño compacto de 2 columnas)
    renderTesterSessionsCompact(sessions);

  } catch (error) {
    console.error('❌ Error al cargar sesiones del tester:', error);
    const content = document.getElementById("dynamic-content");
    if (content) {
      content.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error al cargar tus sesiones</p>
          <p class="error-details">${error.message}</p>
          <button onclick="fetchTesterSessions()" class="retry-btn">
            <i class="fas fa-sync"></i> Reintentar
          </button>
        </div>
      `;
    }
  }
}

// ============================================
// RENDERIZAR SESIONES DE TESTER (DISEÑO COMPACTO)
// ============================================
function renderTesterSessionsCompact(sessions) {
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const closeBtn = document.getElementById("close-panel");

  if (!content) {
    console.error("❌ No se encontró dynamic-content");
    return;
  }

  // Ocultar botón de cerrar en vista de lista
  if (closeBtn) closeBtn.style.display = 'none';

  // Actualizar título
  if (title) {
    title.innerHTML = `<i class="fas fa-gamepad"></i> Mis Sesiones (${sessions.length})`;
  }

  if (!sessions || sessions.length === 0) {
    content.innerHTML = `
      <div class="no-sessions">
        <i class="fas fa-inbox"></i>
        <p>No tienes sesiones asignadas</p>
        <p class="info-text">Espera a que un KeyTester te asigne a una sesión</p>
      </div>
    `;
    return;
  }

  let html = '<div class="sessions-grid-view">';

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

    const sessionId = session._id || session.sessionId;
    const myAssignment = session.assignment || {};

    html += `
      <div class="session-card-compact ${statusClass}">
        <!-- Badge de estado -->
        <div class="session-status-badge ${statusClass}">
          <i class="fas fa-${statusIcon}"></i>
          <span>${statusText}</span>
        </div>

        <!-- Header -->
        <div class="session-card-header">
          <h3 class="session-title">
            <i class="fas fa-gamepad"></i>
            ${session.backendName || 'Sin nombre'}
          </h3>
        </div>

        <!-- Body -->
        <div class="session-card-body">
          <div class="session-info-row">
            <i class="fas fa-calendar-alt"></i>
            <span>${startDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}</span>
          </div>

          <div class="session-info-row">
            <i class="fas fa-clock"></i>
            <span>${session.startTime || startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}</span>
          </div>

          <div class="session-info-row">
            <i class="fas fa-layer-group"></i>
            <span>${session.sessionType || 'N/A'}</span>
          </div>

          ${myAssignment.device || myAssignment.dispositivos?.[0] ? `
            <div class="session-info-row">
              <i class="fas fa-mobile-alt"></i>
              <span>${myAssignment.device || myAssignment.dispositivos?.[0]}</span>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="session-card-footer">
          <button class="btn-view-details-primary" onclick="viewTesterSessionDetails('${sessionId}')">
            <i class="fas fa-eye"></i> Ver detalles
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  content.innerHTML = html;
}

// ============================================
// RENDERIZAR SESIONES DE TESTER (DISEÑO COMPACTO)
// ============================================
function renderTesterSessionsCompact(sessions) {
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const closeBtn = document.getElementById("close-panel");

  if (!content) {
    console.error("❌ No se encontró dynamic-content");
    return;
  }

  // Ocultar botón de cerrar en vista de lista
  if (closeBtn) closeBtn.style.display = 'none';

  // Actualizar título
  if (title) {
    title.innerHTML = `<i class="fas fa-gamepad"></i> Mis Sesiones (${sessions.length})`;
  }

  if (!sessions || sessions.length === 0) {
    content.innerHTML = `
      <div class="no-sessions">
        <i class="fas fa-inbox"></i>
        <p>No tienes sesiones asignadas</p>
        <p class="info-text">Espera a que un KeyTester te asigne a una sesión</p>
      </div>
    `;
    return;
  }

  let html = '<div class="sessions-grid-view">';

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

    const sessionId = session._id || session.sessionId;

    html += `
      <div class="session-card-compact ${statusClass}">
        <!-- Badge de estado -->
        <div class="session-status-badge ${statusClass}">
          <i class="fas fa-${statusIcon}"></i>
          <span>${statusText}</span>
        </div>

        <!-- Header -->
        <div class="session-card-header">
          <h3 class="session-title">
            <i class="fas fa-gamepad"></i>
            ${session.backendName || 'Sin nombre'}
          </h3>
        </div>

        <!-- Body -->
        <div class="session-card-body">
          <div class="session-info-row">
            <i class="fas fa-calendar-alt"></i>
            <span>${startDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}</span>
          </div>

          <div class="session-info-row">
            <i class="fas fa-clock"></i>
            <span>${session.startTime || startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}</span>
          </div>

          <div class="session-info-row">
            <i class="fas fa-layer-group"></i>
            <span>${session.sessionType || 'N/A'}</span>
          </div>

          ${session.device ? `
            <div class="session-info-row">
              <i class="fas fa-mobile-alt"></i>
              <span>${session.device}</span>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="session-card-footer">
          <button class="btn-view-details-primary" onclick="viewTesterSessionDetails('${sessionId}')">
            <i class="fas fa-eye"></i> Ver detalles
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  content.innerHTML = html;
}
// ============================================
// VER DETALLES DE SESIÓN (TESTER)
// ============================================
function viewTesterSessionDetails(sessionId) {
  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const closeBtn = document.getElementById("close-panel");

  if (!sessionId) {
    console.error('ID de sesión no proporcionado');
    return;
  }

  console.log('Consultando detalles de sesión:', sessionId);

  // Mostrar botón de cerrar
  if (closeBtn) closeBtn.style.display = 'flex';

  // Actualizar título
  if (title) {
    title.innerHTML = `<i class="fas fa-arrow-left"></i> Detalles de la Sesión`;
  }

  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando detalles...</div>';

  // ✅ Usar el endpoint correcto
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
      console.log('Datos de la sesión recibidos:', session);

      const startDate = new Date(session.startTime);
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
          <span class="session-type-badge">${session.sessionType || 'N/A'}</span>
        </div>

        <div class="info-section">
          <h4><i class="fas fa-info-circle"></i> Información General</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>Fecha</label>
              <span>${startDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}</span>
            </div>
            <div class="info-item">
              <label>Hora de inicio</label>
              <span>${session.startTime || startDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
            </div>
            ${myAssignment.device || myAssignment.dispositivos?.[0] ? `
              <div class="info-item">
                <label>Dispositivo asignado</label>
                <span class="device-badge">${myAssignment.device || myAssignment.dispositivos?.[0]}</span>
              </div>
            ` : ''}
            ${myAssignment.capturas && myAssignment.capturas.length > 0 ? `
              <div class="info-item">
                <label>Capturas</label>
                <span>${myAssignment.capturas.join(', ')}</span>
              </div>
            ` : ''}
            ${session.description ? `
              <div class="info-item" style="grid-column: 1 / -1;">
                <label>Descripción</label>
                <span>${session.description}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${session.buildString ? `
          <div class="build-section">
            <h4><i class="fas fa-code-branch"></i> Build String</h4>
            <div class="build-string">${session.buildString}</div>
          </div>
        ` : ''}

        ${session.buildString ? `
          <div class="command-section">
            <h4><i class="fas fa-terminal"></i> Comando de Instalación</h4>
            <div class="command-controls">
              ${hasLWM ? `
                <button class="toggle-br-btn" onclick="toggleBR('${sessionId}')">
                  <i class="fas fa-align-left"></i> Alternar BR
                </button>
              ` : ''}
            </div>
            <div class="command-box-wrapper">
              <pre class="command-box" id="command-box-${sessionId}">${command}</pre>
              <button class="copy-btn" onclick="copyCommand('${sessionId}')">
                <i class="fas fa-copy"></i> Copiar
              </button>
            </div>
          </div>
        ` : ''}

        <div class="detail-actions">
          <button class="btn-back" onclick="closeTesterSessionDetails()">
            <i class="fas fa-arrow-left"></i> Volver a mis sesiones
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
        <button onclick="fetchTesterSessions()" class="retry-btn">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
      </div>
    `;
    });
}

// ============================================
// CERRAR DETALLES DE SESIÓN (TESTER)
// ============================================
function closeTesterSessionDetails() {
  fetchTesterSessions();
}
// ============================================
// CERRAR DETALLES DE SESIÓN (TESTER)
// ============================================
function closeTesterSessionDetails() {
  fetchTesterSessions();
}

// ============================================
// RENDERIZAR LISTA DE SESIONES EN PANEL (ÁREA NARANJA)
// ============================================
function renderSessionsListInPanel(sessions, userType) {
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const closeBtn = document.getElementById("close-panel");

  // Ocultar botón de cerrar en vista de lista
  closeBtn.style.display = 'none';

  if (!sessions || sessions.length === 0) {
    title.innerHTML = `<i class="fas fa-gamepad"></i> Mis Sesiones`;
    content.innerHTML = `
      <div class="no-sessions">
        <i class="fas fa-inbox"></i>
        <p>No tienes sesiones ${userType === 'keytester' ? 'creadas' : 'asignadas'}</p>
        ${userType === 'keytester' ? `
          <button class="action-btn create-btn" onclick="window.location.href='/keytester_sessions.html'">
            <i class="fas fa-plus"></i> Crear primera sesión
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  title.innerHTML = `
    <i class="fas fa-gamepad"></i> 
    Mis Sesiones (${sessions.length})
  `;

  let html = '<div class="sessions-grid-view">';

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

    const sessionId = session._id || session.sessionId;
    const testersCount = session.assignedTesters?.length || 0;
    const myAssignment = session.assignment || {};

    html += `
      <div class="session-card-compact ${statusClass}">
        <div class="session-status-badge ${statusClass}">
          <i class="fas fa-${statusIcon}"></i>
          <span>${statusText}</span>
        </div>
        
        <div class="session-card-header">
          <h4 class="session-title">
            <i class="fas fa-gamepad"></i>
            ${session.backendName || 'Sin nombre'}
          </h4>
        </div>

        <div class="session-card-body">
          <div class="session-info-row">
            <i class="fas fa-calendar-alt"></i>
            <span>${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          <div class="session-info-row">
            <i class="fas fa-clock"></i>
            <span>${session.startTime || startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          ${userType === 'keytester' ? `
            <div class="session-info-row">
              <i class="fas fa-users"></i>
              <span>${testersCount} testers</span>
            </div>
            
            <div class="session-info-row">
              <i class="fas fa-code-branch"></i>
              <span>${session.buildString || 'N/A'}</span>
            </div>
          ` : `
            <div class="session-info-row">
              <i class="fas fa-gamepad"></i>
              <span>${myAssignment.device || myAssignment.dispositivos?.[0] || 'N/A'}</span>
            </div>
            
            <div class="session-info-row">
              <i class="fas fa-camera"></i>
              <span>${myAssignment.capturas && myAssignment.capturas.length > 0
        ? myAssignment.capturas.join(', ')
        : 'Ninguna'}</span>
            </div>
          `}
        </div>

        <div class="session-card-footer">
          <button class="btn-view-details-primary" onclick="viewSessionDetailsExpanded('${sessionId}', '${userType}')">
            <i class="fas fa-eye"></i> Ver detalles
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  content.innerHTML = html;
}
// ============================================
// VER DETALLES EXPANDIDOS (ÁREA AMARILLA)
// ============================================
function viewSessionDetailsExpanded(sessionId, userType) {
  const closeBtn = document.getElementById("close-panel");
  const title = document.getElementById("panel-title");

  // Mostrar botón de cerrar
  closeBtn.style.display = 'flex';

  // Actualizar título
  title.innerHTML = '<i class="fas fa-arrow-left"></i> Detalles de la Sesión';

  // Llamar a la función de detalles correspondiente
  if (userType === 'keytester') {
    viewSessionDetails(sessionId);
  } else {
    viewTesterSessionDetails(sessionId);
  }
}

// ============================================
// MODIFICAR BOTÓN DE CERRAR PARA VOLVER A LA LISTA
// ============================================
const closePanel = document.getElementById("close-panel");
if (closePanel) {
  closePanel.addEventListener("click", function () {
    // Volver a cargar la lista de sesiones según el tipo de usuario
    if (currentUser) {
      if (currentUser.userType === "keytester" || currentUser.isAdmin) {
        fetchKeyTesterSessions();
      } else {
        fetchTesterSessions();
      }
    }
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
// Ver detalles completos de una sesión
function viewSessionDetails(sessionId) {
  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");
  const closeBtn = document.getElementById("close-panel");


  panel.classList.remove("hidden");
  if (closeBtn) {
    closeBtn.style.display = 'flex';
  }
  title.innerHTML = '<i class="fas fa-gamepad"></i> Detalles de la Sesión';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando detalles...</div>';

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
      console.log('Datos recibidos de la sesión:', session);

      // Formatear fechas con validación
      let formattedDate = 'N/A';
      let formattedTime = 'N/A';

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

        <!-- Testers Section -->
${session.assignedTesters && session.assignedTesters.length > 0 ? `
  <div class="testers-section">
    <h4 class="section-title">
      <i class="fas fa-users"></i>
      Testers Asignados (${session.assignedTesters.length})
    </h4>
    <div class="testers-grid-enhanced">
      ${session.assignedTesters.map(tester => {
        const testerId = tester.Epam_user || tester.testerId || tester._id;
        const testerAvatar = getRandomAvatar();

        // Estado de instalación
        const installStatus = tester.StateOfInstalling || 'no instalado';
        let installBadge = '';
        let installIcon = '';

        if (installStatus === 'instalado') {
          installBadge = 'status-installed';
          installIcon = 'check-circle';
        } else if (installStatus === 'instalando') {
          installBadge = 'status-installing';
          installIcon = 'spinner fa-spin';
        } else {
          installBadge = 'status-not-installed';
          installIcon = 'times-circle';
        }

        // Estado de juego
        const isPlaying = tester.IsPlaying === true;
        const playingBadge = isPlaying ? 'status-playing' : 'status-available';
        const playingIcon = isPlaying ? 'gamepad' : 'circle';
        const playingText = isPlaying ? 'Jugando' : 'Disponible';

        return `
          <div class="tester-card-enhanced">
            <!-- Avatar y nombre -->
            <div class="tester-card-header">
              <div class="tester-avatar-wrapper">
                <img src="${testerAvatar}" alt="${testerId}" class="tester-avatar-small" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
                <div class="tester-status-indicator ${playingBadge}">
                  <i class="fas fa-${playingIcon}"></i>
                </div>
              </div>
              <div class="tester-info-header">
                <h5 class="tester-name">${testerId}</h5>
                <span class="tester-playing-status ${playingBadge}">
                  <i class="fas fa-${playingIcon}"></i>
                  ${playingText}
                </span>
              </div>
            </div>

            <!-- Información del tester -->
            <div class="tester-card-body">
              <!-- Dispositivo -->
              ${tester.device ? `
                <div class="tester-info-row">
                  <i class="fas fa-mobile-alt"></i>
                  <span class="device-badge">${tester.device}</span>
                </div>
              ` : ''}

              <!-- Grupo -->
              ${tester.group ? `
                <div class="tester-info-row">
                  <i class="fas fa-layer-group"></i>
                  <span>Grupo ${tester.group}</span>
                </div>
              ` : ''}

              <!-- Capturas -->
              ${tester.capturas && tester.capturas.length > 0 ? `
                <div class="tester-info-row">
                  <i class="fas fa-camera"></i>
                  <div class="captures-list">
                    ${tester.capturas.map(cap => `
                      <span class="capture-tag">${cap}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Estado de instalación -->
              <div class="tester-info-row">
                <i class="fas fa-download"></i>
                <span class="install-status ${installBadge}">
                  <i class="fas fa-${installIcon}"></i>
                  ${installStatus.charAt(0).toUpperCase() + installStatus.slice(1)}
                </span>
              </div>

              <!-- Ubicación -->
              ${tester.Pod || tester.Station ? `
                <div class="tester-info-row">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${tester.Pod || 'N/A'} - ${tester.Station || 'N/A'}</span>
                </div>
              ` : ''}
            </div>

            <!-- Acciones -->
            <div class="tester-card-actions">
              <button 
                class="btn-replace-auto" 
                onclick="replaceTesterFromSession('${session._id}', '${testerId}')"
                title="Reemplazo automático"
              >
                <i class="fas fa-sync-alt"></i>
                Reemplazo Auto
              </button>
              <button 
                class="btn-replace-manual" 
                onclick="openManualReplaceModal('${session._id}', '${testerId}', '${tester.device || ''}')"
                title="Elegir reemplazo manualmente"
              >
                <i class="fas fa-user-edit"></i>
                Reemplazo Manual
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
` : `
  <div class="no-testers">
    <i class="fas fa-user-slash"></i>
    <p>Aún no hay testers asignados a esta sesión</p>
  </div>
`}
        <div class="actions-section">
  <!-- ✅ BOTONES DE CONTROL DE PLAYTEST -->
  <button class="btn-start-playtest" onclick="startPlaytest('${session._id}')">
    <i class="fas fa-play"></i> Iniciar Playtest
  </button>
  <button class="btn-end-playtest" onclick="endPlaytest('${session._id}')">
    <i class="fas fa-stop"></i> Finalizar Playtest
  </button>

   <!-- ✅ NUEVO BOTÓN DE EXPORTACIÓN -->
  ${session.assignedTesters && session.assignedTesters.length > 0 ? `
    <button class="btn-export" onclick="exportTestersToCSV('${session._id}')">
      <i class="fas fa-file-excel"></i> Exportar a Excel/Sheets
    </button>
  ` : ''}

  <!-- Botones existentes -->
  <button class="btn-edit" onclick="editSession('${session._id}')">
    <i class="fas fa-edit"></i> Editar sesión
  </button>
  <button class="btn-delete" onclick="deleteSession('${session._id}')">
    <i class="fas fa-trash"></i> Eliminar sesión
  </button>
  <button class="btn-assign" onclick="window.location.href='/asignar_sesion.html?sessionId=${session._id}'">
    <i class="fas fa-user-plus"></i> Asignar Testers
  </button>
</div>
      </div>
    `;

      // Agregar estilos específicos si no existen
      if (!document.getElementById('session-details-styles')) {
        const style = document.createElement('style');
        style.id = 'session-details-styles';
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
            flex-wrap: wrap;
          }

          .btn-edit, .btn-delete, .btn-assign, .btn-start-playtest, .btn-end-playtest, .btn-replace-tester {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
            transition: all 0.3s ease;
          }

          .btn-edit {
            background: #007bff;
            color: white;
          }

          .btn-edit:hover {
            background: #0056b3;
            transform: translateY(-2px);
          }

          .btn-delete {
            background: #dc3545;
            color: white;
          }

          .btn-delete:hover {
            background: #c82333;
            transform: translateY(-2px);
          }

          .btn-assign {
            background: #28a745;
            color: white;
          }

          .btn-assign:hover {
            background: #218838;
            transform: translateY(-2px);
          }

          .btn-start-playtest {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            font-weight: 600;
          }

          .btn-start-playtest:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
          }

          .btn-end-playtest {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            font-weight: 600;
          }

          .btn-end-playtest:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
          }

          .btn-replace-tester {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            font-size: 12px;
            padding: 6px 12px;
          }

          .btn-replace-tester:hover {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
color: white;
            transform: translateY(-2px);
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
      }
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

// ✅ FUNCIONES PARA CONTROLAR PLAYTEST
async function startPlaytest(sessionId) {
  if (!confirm('¿Iniciar el playtest? Esto marcará a todos los testers como "jugando".')) {
    return;
  }

  const token = getToken();

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/start-playtest`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      showNotification(data.message, 'success');
      // Recargar detalles de la sesión
      setTimeout(() => viewSessionDetails(sessionId), 1000);
    } else {
      throw new Error(data.message || 'Error al iniciar playtest');
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

async function endPlaytest(sessionId) {
  if (!confirm('¿Finalizar el playtest? Esto desmarcará a todos los testers.')) {
    return;
  }

  const token = getToken();

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/end-playtest`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      showNotification(data.message, 'success');
      setTimeout(() => viewSessionDetails(sessionId), 1000);
    } else {
      throw new Error(data.message || 'Error al finalizar playtest');
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

// ✅ FUNCIÓN PARA ACTUALIZAR ESTADO DE INSTALACIÓN (TESTERS)
async function updateInstallationStatus(status) {
  const token = getToken();

  try {
    const response = await fetch(`${SERVER_URL}/api/user/update-installation-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('Estado de instalación actualizado correctamente', 'success');

      // Actualizar indicador visual
      const indicator = document.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator status-${status.replace(' ', '-')}`;
      }
    } else {
      throw new Error(data.message || 'Error al actualizar estado');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al actualizar estado: ' + error.message, 'error');

    // Revertir el select
    await fetchProfile();
  }
}

// ✅ FUNCIÓN PARA MOSTRAR NOTIFICACIONES
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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
      
      <div class="installation-status-control">
        <label for="installation-status">Estado de Instalación:</label>
        <select id="installation-status" onchange="updateInstallationStatus(this.value)">
          <option value="no instalado" ${user.StateOfInstalling === 'no instalado' ? 'selected' : ''}>❌ No instalado</option>
          <option value="instalando" ${user.StateOfInstalling === 'instalando' ? 'selected' : ''}>⏳ Instalando</option>
          <option value="instalado" ${user.StateOfInstalling === 'instalado' ? 'selected' : ''}>✅ Instalado</option>
        </select>
        <span class="status-indicator status-${(user.StateOfInstalling || 'no-instalado').replace(' ', '-')}"></span>
      </div>
    `;

    document.getElementById("profile-data").innerHTML = html;

    let userInfo = `<span>${user.Epam_user}</span>`;
    document.getElementById("user-info").innerHTML = userInfo;

    // RENDERIZAR ACCIONES SEGÚN TIPO DE USUARIO
    const actionsContainer = document.getElementById("profile-actions");

    if (user.userType === "keytester" || user.isAdmin) {
      console.log("👑 Usuario KeyTester detectado");

      actionsContainer.innerHTML = `
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

      // ✅ Cargar sesiones de KeyTester en la columna izquierda
      console.log("🎮 Cargando sesiones de KeyTester...");
      await fetchKeyTesterSessions();

    } else {
      console.log("🎮 Usuario Tester detectado");

      actionsContainer.innerHTML = `
        <div class="tester-actions">
          <button class="action-btn view-btn" onclick="fetchTesterSessions()">
            <i class="fas fa-sync"></i> Actualizar sesiones
          </button>
        </div>
      `;

      // ✅ Cargar sesiones de Tester en el panel derecho
      console.log("📋 Cargando sesiones de Tester...");
      await fetchTesterSessions();
    }

    console.log("✅ fetchProfile completado");

  } catch (error) {
    console.error("❌ Error en fetchProfile:", error);
    showError("Error al cargar el perfil: " + error.message);
  }

  console.log("=== FIN fetchProfile ===");
}

// Función para actualizar estado de instalación
async function updateInstallationStatus(status) {
  const token = getToken();

  try {
    const response = await fetch(`${SERVER_URL}/api/user/update-installation-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (response.ok) {
      // Mostrar mensaje de éxito
      showNotification('Estado de instalación actualizado correctamente', 'success');

      // Actualizar indicador visual
      const indicator = document.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator status-${status}`;
      }
    } else {
      throw new Error(data.message || 'Error al actualizar estado');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al actualizar estado: ' + error.message, 'error');

    // Revertir el select
    await fetchProfile();
  }
}

// Función auxiliar para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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
// FUNCIÓN PARA REEMPLAZAR TESTER DESDE DETALLES DE SESIÓN
async function replaceTesterFromSession(sessionId, testerId) {
  if (!confirm(`¿Estás seguro de que deseas reemplazar al tester ${testerId}?`)) {
    return;
  }

  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");

  // Mostrar mensaje de carga
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'loading-overlay';
  loadingMsg.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Reemplazando tester...</p>
        </div>
    `;
  content.appendChild(loadingMsg);

  try {
    const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/replace/${testerId}`, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    // Remover mensaje de carga
    loadingMsg.remove();

    if (res.ok) {
      // Mostrar mensaje de éxito
      const successMsg = document.createElement('div');
      successMsg.className = 'success-message-float';
      successMsg.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Tester reemplazado correctamente
                ${data.newTester ? `<br><small>Nuevo: ${data.newTester.Epam_user || data.newTester.testerId}</small>` : ''}
            `;
      content.appendChild(successMsg);

      // Remover mensaje después de 3 segundos
      setTimeout(() => successMsg.remove(), 3000);

      // Recargar los detalles de la sesión
      viewSessionDetails(sessionId);
    } else {
      // Mostrar mensaje de error
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message-float';
      errorMsg.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                ${data.message || "Error al reemplazar tester"}
            `;
      content.appendChild(errorMsg);

      setTimeout(() => errorMsg.remove(), 3000);
    }
  } catch (error) {
    loadingMsg.remove();

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message-float';
    errorMsg.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            Error de conexión al reemplazar tester
        `;
    content.appendChild(errorMsg);

    setTimeout(() => errorMsg.remove(), 3000);
    console.error(error);
  }
}
// === POD TESTERS ===
async function showPodTesters() {
  const token = getToken();
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");

  panel.classList.remove("hidden");
  title.innerHTML = '<i class="fas fa-users"></i> Testers de mi pod';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando testers...</div>';

  //startAutoRefresh('pod-testers', 5);

  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`${SERVER_URL}/api/testers-in-pod?_t=${timestamp}`, {
      headers: {
        Authorization: token,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });

    if (!res.ok) throw new Error("Error HTTP: " + res.status);
    const testers = await res.json();

    console.log("📊 DATOS POD RECIBIDOS:", testers);

    if (!testers.length) {
      content.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users-slash"></i>
          <p>No hay testers en tu pod</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="testers-table-container">
        <div class="table-header-info">
          <span><i class="fas fa-users"></i> Total: ${testers.length} testers</span>
          <span class="last-update">Última actualización: ${new Date().toLocaleTimeString('es-ES')}</span>
        </div>
        <table class="testers-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Pod</th>
              <th>Estación</th>
              <th>Región</th>
              <th>Dispositivos</th>
              <th>Estado Instalación</th>
              <th>Estado Jugando</th>
            </tr>
          </thead>
          <tbody>
            ${testers.map((t) => {
      const devices = Array.isArray(t.Devices)
        ? t.Devices.map((d) => d.name).join(", ")
        : "-";

      const installStatus = t.StateOfInstalling || 'no instalado';
      let installBadge = '';
      if (installStatus === 'instalado') {
        installBadge = '<span class="status-badge status-installed">✅ Instalado</span>';
      } else if (installStatus === 'instalando') {
        installBadge = '<span class="status-badge status-installing">⏳ Instalando</span>';
      } else {
        installBadge = '<span class="status-badge status-not-installed">❌ No instalado</span>';
      }

      // ✅ CAMBIO: IsPlaying en lugar de isPlaying
      console.log(`👤 ${t.Epam_user} - IsPlaying:`, t.IsPlaying);

      const isPlaying = t.IsPlaying === true; // ✅ CAMBIO AQUÍ
      const playingBadge = isPlaying
        ? '<span class="status-badge status-playing">🎮 Jugando</span>'
        : '<span class="status-badge status-available">⚪ Disponible</span>';

      return `
                <tr onclick="viewUserDetails('${t._id}')" style="cursor: pointer;">
                  <td><strong>${t.Epam_user}</strong></td>
                  <td>${t.Pod || 'N/A'}</td>
                  <td>${t.Station || 'N/A'}</td>
                  <td>${t.Region || 'N/A'}</td>
                  <td>${devices}</td>
                  <td>${installBadge}</td>
                  <td>${playingBadge}</td>
                </tr>
              `;
    }).join("")}
          </tbody>
        </table>
      </div>
    `;

    content.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar testers del pod:', error);
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar testers: ${error.message}</p>
        <button onclick="showPodTesters()" class="retry-btn">
          <i class="fas fa-sync"></i> Reintentar
        </button>
      </div>
    `;
  }
}
// === ALL TESTERS ===
async function showAllTesters() {
  const token = getToken();
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");

  panel.classList.remove("hidden");
  title.innerHTML = '<i class="fas fa-globe"></i> Todos los testers';
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando testers...</div>';

  //startAutoRefresh('all-testers', 5);

  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`${SERVER_URL}/api/all-testers?_t=${timestamp}`, {
      headers: {
        Authorization: token,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });

    if (!res.ok) throw new Error("Error HTTP: " + res.status);
    const testers = await res.json();

    console.log("📊 DATOS RECIBIDOS:", testers);

    if (!testers.length) {
      content.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users-slash"></i>
          <p>No hay testers registrados</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="testers-table-container">
        <div class="table-header-info">
          <span><i class="fas fa-users"></i> Total: ${testers.length} testers</span>
          <span class="last-update">Última actualización: ${new Date().toLocaleTimeString('es-ES')}</span>
        </div>
        <table class="testers-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Pod</th>
              <th>Estación</th>
              <th>Región</th>
              <th>Dispositivos</th>
              <th>Estado Instalación</th>
              <th>Estado Jugando</th>
            </tr>
          </thead>
          <tbody>
            ${testers.map((t) => {
      const devices = Array.isArray(t.Devices)
        ? t.Devices.map((d) => d.name).join(", ")
        : "-";

      const installStatus = t.StateOfInstalling || 'no instalado';
      let installBadge = '';
      if (installStatus === 'instalado') {
        installBadge = '<span class="status-badge status-installed">✅ Instalado</span>';
      } else if (installStatus === 'instalando') {
        installBadge = '<span class="status-badge status-installing">⏳ Instalando</span>';
      } else {
        installBadge = '<span class="status-badge status-not-installed">❌ No instalado</span>';
      }

      // ✅ CAMBIO: IsPlaying en lugar de isPlaying
      console.log(`👤 ${t.Epam_user} - IsPlaying:`, t.IsPlaying);

      const isPlaying = t.IsPlaying === true; // ✅ CAMBIO AQUÍ
      const playingBadge = isPlaying
        ? '<span class="status-badge status-playing">🎮 Jugando</span>'
        : '<span class="status-badge status-available">⚪ Disponible</span>';

      return `
                <tr onclick="viewUserDetails('${t._id}')" style="cursor: pointer;">
                  <td><strong>${t.Epam_user}</strong></td>
                  <td>${t.Pod || 'N/A'}</td>
                  <td>${t.Station || 'N/A'}</td>
                  <td>${t.Region || 'N/A'}</td>
                  <td>${devices}</td>
                  <td>${installBadge}</td>
                  <td>${playingBadge}</td>
                </tr>
              `;
    }).join("")}
          </tbody>
        </table>
      </div>
    `;

    content.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar testers:', error);
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar testers: ${error.message}</p>
        <button onclick="showAllTesters()" class="retry-btn">
          <i class="fas fa-sync"></i> Reintentar
        </button>
      </div>
    `;
  }
}

// === EDIT SESSION LINK ===
function editSession(sessionId) {
  window.location.href = `/pages/edit_session.html?id=${sessionId}`;
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

// Función para ver detalles de un usuario
async function showUserDetails(userId) {
  const token = localStorage.getItem("token");
  const content = document.getElementById("dynamic-content");
  const title = document.getElementById("panel-title");
  const panel = document.getElementById("dynamic-panel");

  if (!content) {
    console.error("Contenedor dynamic-content no encontrado");
    return;
  }

  // Abrir panel
  panel.classList.remove("hidden");
  title.innerHTML = '<i class="fas fa-user"></i> Detalles del Usuario';

  // Mostrar loading
  content.innerHTML = `
    <div class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando detalles del usuario...</p>
    </div>
  `;

  try {
    const res = await fetch(`${SERVER_URL}/api/users/${userId}/details`, {
      headers: { "Authorization": token }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al cargar usuario');
    }

    const data = await res.json();
    const { user, stats } = data;

    // Obtener avatar consistente
    const userAvatar = getConsistentAvatar(user);

    // Renderizar detalles del usuario
    content.innerHTML = `
      <div class="user-details-container">
        <!-- Header -->
        <div class="user-header">
          <button class="btn-back" onclick="performSearch('${searchInput.value}')">
            <i class="fas fa-arrow-left"></i> Volver a búsqueda
          </button>
          <h2>
            <i class="fas fa-user-circle"></i>
            Detalles de ${user.Epam_user}
          </h2>
        </div>

        <!-- Avatar y Info Principal -->
        <div class="user-main-info">
          <div class="user-avatar-section">
            <img src="${userAvatar}" alt="${user.Epam_user}" class="user-avatar-large" onerror="this.onerror=null; this.src='/images/avatars/peep-1.png';">
            <h3>${user.Epam_user}</h3>
            <div class="user-badges">
              <span class="badge ${user.userType === 'keytester' ? 'badge-keytester' : 'badge-tester'}">
                ${user.userType === 'keytester' ? 'Key Tester' : 'Tester'}
              </span>
              ${user.isAdmin ? '<span class="badge badge-admin">Admin</span>' : ''}
            </div>
            <span class="status-badge status-${user.availability?.toLowerCase() || 'na'}">
              ${user.availability || 'N/A'}
            </span>
          </div>
        </div>

        <!-- Información Principal -->
        <div class="user-info-grid">
          <!-- Tarjeta de Información Personal -->
          <div class="info-card">
            <h3><i class="fas fa-id-card"></i> Información Personal</h3>
            <div class="info-row">
              <span class="label">Usuario EPAM:</span>
              <span class="value">${user.Epam_user}</span>
            </div>
            <div class="info-row">
              <span class="label">Tipo de Usuario:</span>
              <span class="value">
                <span class="badge ${user.userType === 'keytester' ? 'badge-keytester' : 'badge-tester'}">
                  ${user.userType === 'keytester' ? 'Key Tester' : 'Tester'}
                </span>
                ${user.isAdmin ? '<span class="badge badge-admin">Admin</span>' : ''}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Disponibilidad:</span>
              <span class="value">
                <span class="status-badge status-${user.availability?.toLowerCase() || 'na'}">
                  ${user.availability || 'N/A'}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="label">Jugando:</span>
              <span class="value">${user.IsPlaying ? '🎮 Sí' : '❌ No'}</span>
            </div>
            <div class="info-row">
              <span class="label">Estado de Instalación:</span>
              <span class="value">
                <span class="install-badge install-${user.StateOfInstalling || 'no-instalado'}">
                  ${user.StateOfInstalling || 'No instalado'}
                </span>
              </span>
            </div>
          </div>

          <!-- Tarjeta de Ubicación -->
          <div class="info-card">
            <h3><i class="fas fa-map-marker-alt"></i> Ubicación</h3>
            <div class="info-row">
              <span class="label">Región:</span>
              <span class="value">${user.Region || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">POD:</span>
              <span class="value">${user.Pod || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Estación:</span>
              <span class="value">${user.Station || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">MMR:</span>
              <span class="value">${user.Mmr || 'N/A'}</span>
            </div>
          </div>

          <!-- Tarjeta de Dispositivos -->
          <div class="info-card">
            <h3><i class="fas fa-gamepad"></i> Dispositivos</h3>
            ${user.Devices && user.Devices.length > 0 ? `
              <div class="devices-list">
                ${user.Devices.map(device => `
                  <div class="device-item">
                    <span class="device-name">${device.name}</span>
                    <span class="device-priority">Prioridad: ${device.priority}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="no-data">No hay dispositivos registrados</p>'}
          </div>

          <!-- Tarjeta de Cuentas -->
          <div class="info-card">
            <h3><i class="fas fa-user-friends"></i> Cuentas</h3>
            ${user.Accounts && user.Accounts.length > 0 ? `
              <div class="accounts-list">
                ${user.Accounts.map(account => `
                  <span class="account-badge">${account}</span>
                `).join('')}
              </div>
            ` : '<p class="no-data">No hay cuentas registradas</p>'}
          </div>
        </div>

        <!-- Estadísticas de Sesiones -->
        <div class="sessions-stats">
          <h3>
            <i class="fas fa-chart-bar"></i>
            Estadísticas de Sesiones
          </h3>
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-number">${stats.totalSessions}</span>
              <span class="stat-label">Sesiones Totales</span>
            </div>
          </div>

          ${stats.recentSessions && stats.recentSessions.length > 0 ? `
            <h4>Últimas Sesiones</h4>
            <div class="recent-sessions">
              ${stats.recentSessions.map(session => `
                <div class="session-item">
                  <div class="session-info">
                    <strong>${session.backendName}</strong>
                    <small>${session.buildString}</small>
                  </div>
                  <div class="session-meta">
                    <span class="session-type">${session.sessionType || 'normal'}</span>
                    <span class="session-date">${new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="no-data">No hay sesiones recientes</p>'}
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error al cargar detalles:', error);
    content.innerHTML = `
      <div class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error al cargar detalles</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="performSearch('${searchInput.value}')">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
      </div>
    `;
  }
}

// ============================================
// AUTO-REFRESH DE LISTAS
// ============================================

let autoRefreshInterval = null;
let currentView = null; // 'all-testers', 'pod-testers', o null

// Función para iniciar auto-refresh
function startAutoRefresh(viewType, intervalSeconds = 5) {
  // Detener cualquier refresh anterior
  stopAutoRefresh();

  currentView = viewType;

  // Configurar nuevo intervalo
  autoRefreshInterval = setInterval(() => {
    console.log(`🔄 Auto-refresh: ${viewType}`);

    if (viewType === 'all-testers') {
      showAllTesters();
    } else if (viewType === 'pod-testers') {
      showPodTesters();
    }
  }, intervalSeconds * 1000);

  console.log(`✅ Auto-refresh activado cada ${intervalSeconds} segundos`);
}

// Función para detener auto-refresh
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    currentView = null;
    console.log('⏹️ Auto-refresh detenido');
  }
}
// ============================================
// EXPORTAR TESTERS A CSV/EXCEL (FORMATO ACTUALIZADO)
// ============================================

/**
 * Exporta los testers asignados a una sesión en formato CSV
 * Compatible con Google Sheets y Excel
 */
async function exportTestersToCSV(sessionId) {
  const token = getToken();

  try {
    // Mostrar indicador de carga
    showNotification('Generando archivo de exportación...', 'info');

    // Obtener datos de la sesión
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener datos de la sesión');
    }

    const session = await response.json();

    if (!session.assignedTesters || session.assignedTesters.length === 0) {
      showNotification('No hay testers asignados para exportar', 'error');
      return;
    }

    // Generar CSV
    const csv = generateCSVContent(session);

    // Crear y descargar archivo
    downloadCSV(csv, `Testers_${session.backendName}_${new Date().toISOString().split('T')[0]}.csv`);

    showNotification('✅ Archivo exportado correctamente', 'success');

  } catch (error) {
    console.error('Error al exportar:', error);
    showNotification('Error al exportar: ' + error.message, 'error');
  }
}

/**
 * Genera el contenido CSV con los datos de los testers
 * Formato según imagen proporcionada (nuevo orden)
 */
function generateCSVContent(session) {
  // Encabezados del CSV (según el nuevo orden de la imagen)
  const headers = [
    'Primary',
    'Model',
    'Capture',
    'Config',
    'Location',
    'Station',
    'POD',
    'Tester',
    'Username',
    'Splitscreen (player 2)',
    'Replacement',
    'Reemplazo Plataforma',
    'Comentarios'
  ];

  // Crear filas de datos
  const rows = [];

  session.assignedTesters.forEach((tester) => {
    // Obtener dispositivo principal
    const primaryDevice = tester.device ||
      (Array.isArray(tester.dispositivos) && tester.dispositivos.length > 0
        ? tester.dispositivos[0]
        : 'N/A');

    // Obtener modelo del dispositivo
    const model = getDeviceModel(primaryDevice);

    // Obtener capturas
    const captures = Array.isArray(tester.capturas) && tester.capturas.length > 0
      ? tester.capturas.join(', ')
      : '';

    // Determinar Config (ej: Splitscreen, DX12, etc.)
    const config = getConfig(tester);

    // Location (región)
    const location = tester.region || tester.Region || session.region || 'Bogota';

    // Station
    const station = tester.Station || '';

    // POD
    const pod = tester.Pod || '';

    // Tester (nombre completo)
    const testerName = tester.Epam_user || tester.testerId || '';

    // Username (usuario EPAM formateado)
    const username = testerName ? `EPAM-${testerName.replace(/\s+/g, '')}` : '';

    // Crear fila
    const row = [
      primaryDevice,           // Primary
      model,                   // Model
      captures,                // Capture
      config,                  // Config
      location,                // Location
      station,                 // Station
      pod,                     // POD
      testerName,              // Tester
      username,                // Username
      '',                      // Splitscreen (player 2) - vacío
      '',                      // Replacement - vacío
      '',                      // Reemplazo Plataforma - vacío
      ''                       // Comentarios - vacío
    ];

    rows.push(row);
  });

  // Convertir a formato CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Obtiene el modelo del dispositivo
 */
function getDeviceModel(device) {
  const models = {
    'PS5': 'Test Kit',
    'PS4': 'Base Kit',
    'PS4 Dev': 'Dev Kit',
    'PS5 Dev': 'Test Kit',
    'XSX': 'Anaconda',
    'XB1': 'Base Test Kit',
    'PC': 'Desktop Epic-1',
    'Switch': 'Docked',
    'Android': 'Samsung S20',
    'iOS': 'iPhone 12'
  };

  return models[device] || device || '';
}

/**
 * Determina la configuración especial del tester
 */
function getConfig(tester) {
  const configs = [];

  // Verificar si tiene capturas especiales
  if (Array.isArray(tester.capturas)) {
    if (tester.capturas.includes('DX12')) configs.push('DX12');
    if (tester.capturas.includes('DX11')) configs.push('DX11');
  }

  // Verificar splitscreen
  if (tester.splitScreen || tester.isSplitScreen) {
    configs.push('Splitscreen');
  }

  return configs.join(', ');
}

/**
 * Descarga el archivo CSV
 */
function downloadCSV(csvContent, filename) {
  // Agregar BOM para compatibilidad con Excel y caracteres especiales
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Crear enlace de descarga
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Liberar memoria
  URL.revokeObjectURL(url);
}

// ============================================
// VERSIÓN ALTERNATIVA CON FORMATO EXCEL NATIVO
// ============================================

/**
 * Exporta a formato Excel (.xlsx) con formato y colores
 * Requiere SheetJS: <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
 */
async function exportTestersToExcel(sessionId) {
  const token = getToken();

  try {
    showNotification('Generando archivo Excel...', 'info');

    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error('Error al obtener datos');
    const session = await response.json();

    if (!session.assignedTesters || session.assignedTesters.length === 0) {
      showNotification('No hay testers para exportar', 'error');
      return;
    }

    // Preparar datos
    const headers = [
      'Primary', 'Model', 'Capture', 'Config', 'Location', 'Station',
      'POD', 'Tester', 'Username', 'Splitscreen (player 2)',
      'Replacement', 'Reemplazo Plataforma', 'Comentarios'
    ];

    // Crear datos
    const data = [headers];

    session.assignedTesters.forEach((tester) => {
      const primaryDevice = tester.device ||
        (Array.isArray(tester.dispositivos) && tester.dispositivos.length > 0
          ? tester.dispositivos[0]
          : 'N/A');

      const testerName = tester.Epam_user || tester.testerId || '';
      const username = testerName ? `EPAM-${testerName.replace(/\s+/g, '')}` : '';

      const row = [
        primaryDevice,                                              // Primary
        getDeviceModel(primaryDevice),                             // Model
        Array.isArray(tester.capturas) ? tester.capturas.join(', ') : '', // Capture
        getConfig(tester),                                         // Config
        tester.region || tester.Region || session.region || 'Bogota', // Location
        tester.Station || '',                                      // Station
        tester.Pod || '',                                          // POD
        testerName,                                                // Tester
        username,                                                  // Username
        '',                                                        // Splitscreen (player 2)
        '',                                                        // Replacement
        '',                                                        // Reemplazo Plataforma
        ''                                                         // Comentarios
      ];

      data.push(row);
    });

    // Crear workbook
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Aplicar anchos de columna
    ws['!cols'] = [
      { wch: 10 }, // Primary
      { wch: 20 }, // Model
      { wch: 15 }, // Capture
      { wch: 12 }, // Config
      { wch: 15 }, // Location
      { wch: 10 }, // Station
      { wch: 12 }, // POD
      { wch: 20 }, // Tester
      { wch: 20 }, // Username
      { wch: 20 }, // Splitscreen (player 2)
      { wch: 15 }, // Replacement
      { wch: 20 }, // Reemplazo Plataforma
      { wch: 15 }  // Comentarios
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Testers');

    // Descargar
    XLSX.writeFile(wb, `Testers_${session.backendName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    showNotification('✅ Archivo Excel exportado', 'success');

  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al exportar: ' + error.message, 'error');
  }
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


// ============================================
// INICIALIZACIÓN DEL PERFIL
// ============================================

let profileLoaded = false;

async function initProfile() {
  if (profileLoaded) {
    console.log("⚠️ Profile ya fue cargado, ignorando...");
    return;
  }

  console.log("🚀 Iniciando carga de perfil...");

  // Esperar a que el DOM esté completamente listo
  await waitForDOM();

  profileLoaded = true;

  // Verificar que los contenedores existan
  const profileData = document.getElementById("profile-data");
  const profileActions = document.getElementById("profile-actions");
  const dynamicContent = document.getElementById("dynamic-content");
  const dynamicPanel = document.getElementById("dynamic-panel");

  console.log("📦 Contenedores encontrados:", {
    profileData: !!profileData,
    profileActions: !!profileActions,
    dynamicContent: !!dynamicContent,
    dynamicPanel: !!dynamicPanel
  });

  if (!profileData || !profileActions || !dynamicContent || !dynamicPanel) {
    console.error("❌ Faltan contenedores en el DOM");
    console.error("Contenedores faltantes:", {
      profileData: !profileData ? "FALTA" : "OK",
      profileActions: !profileActions ? "FALTA" : "OK",
      dynamicContent: !dynamicContent ? "FALTA" : "OK",
      dynamicPanel: !dynamicPanel ? "FALTA" : "OK"
    });

    // Reintentar después de 500ms
    profileLoaded = false;
    setTimeout(initProfile, 500);
    return;
  }

  console.log("✅ Todos los contenedores encontrados, cargando perfil...");
  await fetchProfile();
}

// Función auxiliar para esperar a que el DOM esté listo
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// ============================================
// EVENTOS DE INICIALIZACIÓN
// ============================================

// Método 1: DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("📝 DOMContentLoaded disparado");
  initProfile();
});

// Método 2: window.load (backup)
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
    console.log("⏰ Timeout de seguridad (2s) - forzando carga");
    initProfile();
  }
}, 2000);

console.log("✅ Listeners de inicialización registrados");
