const SERVER_URL = "http://10.13.46.195:3000";
const sessionId = new URLSearchParams(window.location.search).get('id');
const token = localStorage.getItem("token");

console.log("🔍 Session ID:", sessionId);
console.log("🔑 Token:", token ? "Presente" : "Ausente");

// Verificación de token
if (!token) {
  console.error("❌ No hay token, redirigiendo...");
  window.location.href = "index.html";
} else {
  fetch(`${SERVER_URL}/protected`, {
    method: "GET",
    headers: { "Authorization": token }
  })
    .then(res => {
      if (!res.ok) {
        console.error("❌ Token inválido");
        localStorage.removeItem("token");
        window.location.href = "../index.html";
      }
    })
    .catch(err => {
      console.error("❌ Error verificando token:", err);
      localStorage.removeItem("token");
      window.location.href = "../index.html";
    });
}

// Event Listener para cambios en el modo de juego
document.addEventListener('DOMContentLoaded', () => {
  const modeSelect = document.getElementById('mode');
  
  if (modeSelect) {
    modeSelect.addEventListener('change', function() {
      const mode = this.value;
      console.log("🎮 Modo seleccionado:", mode);
      
      const normalId = document.getElementById('normal-id');
      const sproutIds = document.getElementById('sprout-ids');
      const splitscreenSection = document.getElementById('splitscreen-section');
      const teamConfig = document.getElementById('team-config');
      const normalTeamsize = document.getElementById('normal-teamsize');

      // Ocultar todos los elementos
      [normalId, sproutIds, splitscreenSection, teamConfig, normalTeamsize]
        .forEach(el => {
          if (el) el.style.display = 'none';
        });

      // Mostrar elementos según el modo seleccionado
      switch(mode) {
        case '100':
        case '80':
          if (normalId) normalId.style.display = 'block';
          if (normalTeamsize) normalTeamsize.style.display = 'block';
          if (splitscreenSection) splitscreenSection.style.display = 'block';
          break;
          
        case 'sprout':
          if (sproutIds) sproutIds.style.display = 'block';
          if (splitscreenSection) splitscreenSection.style.display = 'block';
          break;
          
        case 'juno':
        case 'sparks':
          if (normalId) normalId.style.display = 'block';
          if (teamConfig) teamConfig.style.display = 'block';
          if (splitscreenSection) splitscreenSection.style.display = 'block';
          break;
      }
    });
  }

  // Validaciones para campos numéricos
  ['splitScreenCount', 'teamSize', 'totalTeams'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', function() {
        const min = this.min ? parseInt(this.min) : 1;
        const max = this.max ? parseInt(this.max) : 20;
        const value = parseInt(this.value);
        if (value < min) this.value = min;
        if (value > max) this.value = max;
      });
    }
  });

  // Cargar datos si hay sessionId
  if (sessionId && sessionId !== 'undefined' && sessionId !== 'null') {
    loadSessionData();
  } else {
    showError("ID de sesión no válido");
  }
});

// Función principal para cargar datos de la sesión
async function loadSessionData() {
  console.log("📡 Cargando sesión:", sessionId);
  
  if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
    showError("ID de sesión no proporcionado");
    return;
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
      headers: { "Authorization": token }
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const session = await response.json();
    console.log("✅ Sesión cargada:", session);

    // Establecer modo y disparar evento change
    const modeSelect = document.getElementById('mode');
    if (modeSelect && session.mode) {
      modeSelect.value = session.mode;
      modeSelect.dispatchEvent(new Event('change'));
    }

    // Cargar IDs según el modo
    if (session.mode === 'sprout') {
      setInputValue('idOverrideA', session.idOverrideA);
      setInputValue('idOverrideB', session.idOverrideB);
    } else {
      setInputValue('idOverride', session.idOverride);
    }

    // Cargar Split Screen
    setInputValue('splitScreenCount', session.splitScreenCount || 1);

    // Cargar configuración de equipos
    if (session.mode === 'juno' || session.mode === 'sparks') {
      setInputValue('teamSize', session.teamSize);
      setInputValue('totalTeams', session.totalTeams);
    } else {
      setInputValue('teamSizeNormal', session.teamSize);
    }

    // Cargar campos básicos
    const basicFields = [
      "commsLead", "commsAssist", "backendName", "buildString", "googleDrive",
      "gameModes", "startTime", "premadeTeams", "testPlan", "totalPlayers"
    ];

    basicFields.forEach(field => {
      setInputValue(field, session[field]);
    });

    // Cargar requerimientos de captura
    loadCaptureRequirements(session.captureRequirements || {});

  } catch (error) {
    console.error("❌ Error al cargar sesión:", error);
    showError("Error al cargar los datos de la sesión: " + error.message);
  }
}

// Helper para establecer valores de inputs
function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined && value !== null) {
    element.value = value;
  }
}

// Función para cargar requerimientos de captura
function loadCaptureRequirements(requirements) {
  console.log("📋 Cargando requerimientos de captura:", requirements);
  
  const captureTypes = ['CSVProfile', 'LLM', 'LWM', 'Trace', 'Razor', 'DX11', 'DX12', 'Performance'];
  const platforms = {
    CSVProfile: ['ps4', 'ps4dev', 'ps5', 'ps5dev', 'pc', 'android', 'ios', 'xsx', 'switch'],
    LLM: ['ps4dev', 'ps5dev', 'pc', 'android', 'xsx', 'switch'],
    LWM: ['ps4dev', 'ps5dev', 'xsx', 'switch'],
    Trace: ['pc', 'android', 'ios', 'switch'],
    Razor: ['ps4dev', 'ps5dev', 'xsx'],
    DX11: ['pc'],
    DX12: ['pc'],
    Performance: ['pc']
  };

  captureTypes.forEach(type => {
    if (requirements[type]) {
      platforms[type].forEach(platform => {
        const inputId = `${type.toLowerCase()}_${platform}`;
        const input = document.getElementById(inputId);
        if (input) {
          const platformKey = platform === 'ps4dev' ? 'PS4 Dev' :
                            platform === 'ps5dev' ? 'PS5 Dev' :
                            platform.charAt(0).toUpperCase() + platform.slice(1);
          input.value = requirements[type][platformKey] || 0;
        }
      });
    }
  });
}

// Manejar el envío del formulario
document.getElementById("editSessionForm")?.addEventListener("submit", async function(e) {
  e.preventDefault();

  console.log("💾 Guardando cambios...");

  // Construir objeto de datos según el modo seleccionado
  const mode = document.getElementById('mode').value;
  const data = {
    mode,
    commsLead: document.getElementById("commsLead").value,
    commsAssist: document.getElementById("commsAssist").value,
    backendName: document.getElementById("backendName").value,
    buildString: document.getElementById("buildString").value,
    googleDrive: document.getElementById("googleDrive").value,
    gameModes: document.getElementById("gameModes").value,
    startTime: document.getElementById("startTime").value,
    premadeTeams: document.getElementById("premadeTeams").value,
    testPlan: document.getElementById("testPlan").value,
    totalPlayers: parseInt(document.getElementById("totalPlayers").value) || 0,
    splitScreenCount: parseInt(document.getElementById("splitScreenCount").value) || 1
  };

  // Agregar campos específicos según el modo
  if (mode === 'sprout') {
    data.idOverrideA = document.getElementById("idOverrideA").value;
    data.idOverrideB = document.getElementById("idOverrideB").value;
  } else {
    data.idOverride = document.getElementById("idOverride").value;
  }

  if (mode === 'juno' || mode === 'sparks') {
    data.teamSize = parseInt(document.getElementById("teamSize").value) || 0;
    data.totalTeams = parseInt(document.getElementById("totalTeams").value) || 0;
  } else {
    const teamSizeNormal = document.getElementById("teamSizeNormal");
    if (teamSizeNormal) {
      data.teamSize = teamSizeNormal.value;
    }
  }

  // Construir requerimientos de captura
  data.captureRequirements = buildCaptureRequirements();

  console.log("📦 Datos a enviar:", data);

  try {
    const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(data)
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error:", errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Sesión actualizada:", result);
    
    showSuccess("Sesión actualizada con éxito");
    
    // Mostrar overlay de carga
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.remove("hidden");
    }

    // Redirigir después de 2 segundos
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 2000);

  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    showError("Error al actualizar la sesión: " + error.message);
    
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }
  }
});

// Función para construir requerimientos de captura
function buildCaptureRequirements() {
  return {
    CSVProfile: {
      PS4: getInputValue("csvprofile_ps4"),
      "PS4 Dev": getInputValue("csvprofile_ps4dev"),
      PS5: getInputValue("csvprofile_ps5"),
      "PS5 Dev": getInputValue("csvprofile_ps5dev"),
      PC: getInputValue("csvprofile_pc"),
      Android: getInputValue("csvprofile_android"),
      iOS: getInputValue("csvprofile_ios"),
      XSX: getInputValue("csvprofile_xsx"),
      Switch: getInputValue("csvprofile_switch")
    },
    LLM: {
      "PS4 Dev": getInputValue("llm_ps4dev"),
      "PS5 Dev": getInputValue("llm_ps5dev"),
      PC: getInputValue("llm_pc"),
      Android: getInputValue("llm_android"),
      XSX: getInputValue("llm_xsx"),
      Switch: getInputValue("llm_switch")
    },
    LWM: {
      "PS4 Dev": getInputValue("lwm_ps4dev"),
      "PS5 Dev": getInputValue("lwm_ps5dev"),
      XSX: getInputValue("lwm_xsx"),
      Switch: getInputValue("lwm_switch")
    },
    Trace: {
      PC: getInputValue("trace_pc"),
      Android: getInputValue("trace_android"),
      iOS: getInputValue("trace_ios"),
      Switch: getInputValue("trace_switch")
    },
    Razor: {
      "PS4 Dev": getInputValue("razor_ps4dev"),
      "PS5 Dev": getInputValue("razor_ps5dev"),
      XSX: getInputValue("razor_xsx")
    },
    DX11: {
      PC: getInputValue("dx11_pc")
    },
    DX12: {
      PC: getInputValue("dx12_pc")
    },
    Performance: {
      PC: getInputValue("performance_pc")
    }
  };
}

// Helper para obtener valores numéricos
function getInputValue(id) {
  const element = document.getElementById(id);
  return element ? (parseInt(element.value) || 0) : 0;
}

// Función para mostrar errores
function showError(message) {
  const messageElement = document.getElementById("message");
  if (messageElement) {
    messageElement.className = "error";
    messageElement.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      ${message}
    `;
  }
}

// Función para mostrar éxito
function showSuccess(message) {
  const messageElement = document.getElementById("message");
  if (messageElement) {
    messageElement.className = "success";
    messageElement.innerHTML = `
      <i class="fas fa-check-circle"></i>
      ${message}
    `;
  }
}

// Función para validar campos numéricos
function validateNumericInput(input) {
  const value = parseInt(input.value);
  const min = parseInt(input.min) || 0;
  const max = parseInt(input.max) || Infinity;
  
  if (isNaN(value)) {
    input.value = min;
  } else {
    input.value = Math.max(min, Math.min(max, value));
  }
}

// Agregar validación a todos los inputs numéricos
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('input', () => validateNumericInput(input));
  input.addEventListener('blur', () => validateNumericInput(input));
});

// Botón de cancelar
document.addEventListener('DOMContentLoaded', () => {
  console.log("🔧 Configurando botón cancelar...");
  
  const cancelBtn = document.querySelector('.cancel-btn');
  
  if (cancelBtn) {
    // Asegurarse de que sea type="button"
    cancelBtn.setAttribute('type', 'button');
    
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      console.log("🚫 Botón cancelar presionado");
      
      if (confirm('¿Estás seguro de que deseas cancelar la edición?\n\nLos cambios no guardados se perderán.')) {
        console.log("✅ Usuario confirmó cancelación");
        console.log("🔙 Redirigiendo a profile.html...");
        
        // Redirigir sin recargar
        window.location.href = 'profile.html';
      } else {
        console.log("❌ Usuario canceló la cancelación");
      }
    });
    
    console.log("✅ Botón cancelar configurado correctamente");
  } else {
    console.warn("⚠️ No se encontró el botón cancelar");
  }
});

// Prevenir envío accidental al presionar Enter
document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
    e.preventDefault();
  }
});