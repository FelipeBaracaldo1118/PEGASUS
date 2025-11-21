const SERVER_URL = "http://10.13.46.195:3000";
const token = localStorage.getItem("token");

// Verificación de token
if (!token) {
    window.location.href = "../index.html";
} else {
    fetch(`${SERVER_URL}/protected`, {
        method: "GET",
        headers: { "Authorization": token }
    })
        .then(res => {
            if (!res.ok) {
                localStorage.removeItem("token");
                window.location.href = "../index.html";
            }
        })
        .catch(err => {
            console.error("Error verificando token:", err);
            localStorage.removeItem("token");
            window.location.href = "../index.html";
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const modeSelect = document.getElementById("mode");
    const idA = document.getElementById("idOverrideA");
    const idB = document.getElementById("idOverrideB");
    const idOverride = document.getElementById("idOverride");
    const sproutDiv = document.getElementById("sprout-ids");
    const normalDiv = document.getElementById("normal-id");

    // 🔹 Nuevos elementos
    const splitscreenSection = document.getElementById("splitscreen-section");
    const teamConfigSection = document.getElementById("team-config");
    const normalTeamsizeDiv = document.getElementById("normal-teamsize");

    //volver atras 
     const backButton = document.getElementById("backButton");
      if (backButton) {
        backButton.addEventListener("click", function() {
            window.history.back();
        });
      }
    const presetsPorModo = {
        "100": {
            csv_ps4: 4,
            csv_ps4dev: 1,
            csv_ps5: 2,
            csv_ps5dev: 1,
            csv_pc: 3,
            csv_android: 1,
            csv_ios: 1,
            csv_xsx: 1,
            csv_switch: 1,
            llm_ps4dev: 1,
            llm_ps5dev: 1,
            llm_pc: 1,
            lwm_ps4dev: 1,
            trace_pc: 1,
            trace_android: 1,
            trace_ios: 1,
            razor_ps4dev: 1,
            razor_ps5dev: 1,
            dx11_pc: 1,
            dx12_pc: 1,
            perf_pc: 1
        },
        "80": {
            csv_ps4: 3,
            csv_ps4dev: 1,
            csv_ps5: 2,
            csv_pc: 2,
            csv_android: 1,
            csv_ios: 1,
            csv_xsx: 1,
            csv_switch: 1,
            llm_ps4dev: 1,
            llm_ps5dev: 1,
            lwm_ps4dev: 1,
            trace_pc: 1,
            razor_ps4dev: 1,
            dx12_pc: 1
        },
        "sprout": {
            csv_ps4: 2,
            csv_ps4dev: 1,
            csv_ps5: 2,
            csv_pc: 2,
            csv_xsx: 1,
            csv_switch: 1,
            llm_pc: 1,
            lwm_xsx: 1,
            trace_pc: 1,
            razor_xsx: 1
        },
        "juno": {
            csv_pc: 3,
            csv_ps5: 2,
            csv_ps4: 2,
            csv_switch: 1,
            llm_pc: 1,
            lwm_xsx: 1,
            trace_pc: 1
        },
        "sparks": {
            csv_pc: 2,
            csv_ps5: 1,
            csv_ps4: 1,
            csv_switch: 1,
            llm_pc: 1,
            lwm_xsx: 1,
            trace_pc: 1
        }
    };

    // Validaciones de elementos
    if (!modeSelect || !idA || !idB || !idOverride || !sproutDiv || !normalDiv) {
        console.error("Error: faltan elementos en el DOM");
        return;
    }

    // --- Función para llenar inputs según preset ---
    function llenarCapturasPorId(preset) {
        document.querySelectorAll("table input[type='number']").forEach(input => input.value = "");
        Object.keys(preset).forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = preset[id];
        });
    }

    // 🔹 Configuración por defecto según modo
    const defaultConfigs = {
        sprout: {
            splitScreen: 2,
            teamSize: null,
            totalTeams: null
        },
        juno: {
            splitScreen: null,
            teamSize: 4,
            totalTeams: 10,
            buildsCount: 2
        },
        sparks: {
            splitScreen: 1,
            teamSize: 4,
            totalTeams: 5,
            buildsCount: 2
        }
    };

    // --- Cambio de modo ---
    modeSelect.addEventListener("change", function () {
        const val = this.value.toLowerCase();
        const usaSproutLayout = ["sprout", "juno", "sparks"].includes(val);

        // Mostrar/ocultar los campos de overrides
        sproutDiv.style.display = usaSproutLayout ? "block" : "none";
        normalDiv.style.display = usaSproutLayout ? "none" : "block";
        idA.required = usaSproutLayout;
        idB.required = usaSproutLayout;
        idOverride.required = !usaSproutLayout;
        idOverride.disabled = usaSproutLayout;
        if (usaSproutLayout) idOverride.value = "";

        // 🔹 SPLIT SCREEN: Todos los modos lo necesitan
        splitscreenSection.style.display = "block";

        // 🔹 CONFIG DE EQUIPOS: Solo Sprout, Juno y Sparks
        if (val === "sprout" || val === "juno" || val === "sparks") {
            teamConfigSection.style.display = "block";
            normalTeamsizeDiv.style.display = "none";
        } else {
            teamConfigSection.style.display = "none";
            normalTeamsizeDiv.style.display = "block";
        }

        // 🔹 Valores por defecto según modo
        if (val === "sprout") {
            document.getElementById("splitScreenCount").value = 2;
            document.getElementById("teamSize").value = 4;
            document.getElementById("totalTeams").value = 2; // Grupo A y B

        } else if (val === "juno") {
            document.getElementById("splitScreenCount").value = 2;
            document.getElementById("teamSize").value = 4;
            document.getElementById("totalTeams").value = 10;

        } else if (val === "sparks") {
            document.getElementById("splitScreenCount").value = 2;
            document.getElementById("teamSize").value = 4;
            document.getElementById("totalTeams").value = 5;

        } else if (val === "100" || val === "80") {
            // Battle Royale
            document.getElementById("splitScreenCount").value = 2;
        }

        // Llenar presets
        if (presetsPorModo[val]) llenarCapturasPorId(presetsPorModo[val]);

        console.log("Modo seleccionado:", val);
    });

    // --- Envío del formulario ---
    document.getElementById("sessionForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const mode = modeSelect.value.toLowerCase();
        const usaSproutLayout = ["sprout", "juno", "sparks"].includes(mode);

        if (usaSproutLayout && (!idA.value.trim() || !idB.value.trim())) {
            const msg = document.getElementById("message");
            msg.style.color = "red";
            msg.innerText = "Debes ingresar ambos ID Override para este tipo de sesión.";
            return;
        }

        const captureRequirements = {
            CSVProfile: {
                PS4: +document.getElementById("csv_ps4").value || 0,
                "PS4 Dev": +document.getElementById("csv_ps4dev").value || 0,
                PS5: +document.getElementById("csv_ps5").value || 0,
                "PS5 Dev": +document.getElementById("csv_ps5dev").value || 0,
                PC: +document.getElementById("csv_pc").value || 0,
                Android: +document.getElementById("csv_android").value || 0,
                iOS: +document.getElementById("csv_ios").value || 0,
                XSX: +document.getElementById("csv_xsx").value || 0,
                Switch: +document.getElementById("csv_switch").value || 0
            },
            LLM: {
                "PS4 Dev": +document.getElementById("llm_ps4dev").value || 0,
                "PS5 Dev": +document.getElementById("llm_ps5dev").value || 0,
                PC: +document.getElementById("llm_pc").value || 0,
                Android: +document.getElementById("llm_android").value || 0,
                XSX: +document.getElementById("llm_xsx").value || 0,
                Switch: +document.getElementById("llm_switch").value || 0
            },
            LWM: {
                "PS4 Dev": +document.getElementById("lwm_ps4dev").value || 0,
                "PS5 Dev": +document.getElementById("lwm_ps5dev").value || 0,
                XSX: +document.getElementById("lwm_xsx").value || 0,
                Switch: +document.getElementById("lwm_switch").value || 0
            },
            Trace: {
                PC: +document.getElementById("trace_pc").value || 0,
                Android: +document.getElementById("trace_android").value || 0,
                iOS: +document.getElementById("trace_ios").value || 0,
                Switch: +document.getElementById("trace_switch").value || 0
            },
            Razor: {
                "PS4 Dev": +document.getElementById("razor_ps4dev").value || 0,
                "PS5 Dev": +document.getElementById("razor_ps5dev").value || 0,
                XSX: +document.getElementById("razor_xsx").value || 0
            },
            DX11: { PC: +document.getElementById("dx11_pc").value || 0 },
            DX12: { PC: +document.getElementById("dx12_pc").value || 0 },
            Performance: { PC: +document.getElementById("perf_pc").value || 0 }
        };

        let sessionType = "normal";
        if (["sprout", "juno", "sparks"].includes(mode)) {
            sessionType = mode;
        }

        const data = {
            backendName: document.getElementById("backendName").value,
            buildString: document.getElementById("buildString").value,
            startTime: document.getElementById("startTime").value,
            totalPlayers: +document.getElementById("totalPlayers").value,
            captureRequirements,
            sessionType
        };

        // 🔹 SPLIT SCREEN: Todos los modos lo usan
        const splitScreenInput = document.getElementById("splitScreenCount");
        if (splitScreenInput && splitScreenInput.value) {
            data.splitScreenCount = +splitScreenInput.value;
        }

        // 🔹 TeamSize según el modo
        if (mode === "100" || mode === "80") {
            // Battle Royale usa el campo de texto
            data.teamSize = document.getElementById("teamSizeNormal").value;
        } else if (mode === "sprout" || mode === "juno" || mode === "sparks") {
            // Estos usan configuración de equipos
            data.teamSize = +document.getElementById("teamSize").value;
            data.totalTeams = +document.getElementById("totalTeams").value;
        }

        // 🔹 IDs según layout
        if (usaSproutLayout) {
            data.idOverrideA = idA.value;
            data.idOverrideB = idB.value;
        } else {
            data.idOverride = idOverride.value;
        }

        console.log("Data enviada:", data);

        try {
            const res = await fetch(`${SERVER_URL}/api/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            const msg = document.getElementById("message");

            if (res.ok) {
                msg.style.color = "green";
                msg.innerHTML = `
                ✅ Sesión creada con éxito<br>
                Split Screen: ${data.splitScreenCount || 1}<br>
                ${data.totalTeams ? `Equipos: ${data.totalTeams}<br>` : ''}
                Redirigiendo...
            `;
             // Verificar la estructura de la respuesta
    console.log('Respuesta del servidor:', result);
    // Obtener el sessionId de la respuesta
    const sessionId = result.session?._id || result.sessionId;
    if (!sessionId) {
        console.error('Respuesta sin sessionId:', result);
        msg.style.color = "red";
        msg.innerText = "Error: No se pudo obtener el ID de la sesión";
        return;
    }

    console.log('SessionId obtenido:', sessionId);
                setTimeout(() => {
                    window.location.href = `asignar_sesion.html?sessionId=${sessionId}`;
                }, 1500);
            } else {
                msg.style.color = "red";
                msg.innerText = result.message || "Error al crear la sesión";
            }
        } catch (error) {
            const msg = document.getElementById("message");
            msg.style.color = "red";
            msg.innerText = "Error de conexión: " + error.message;
            console.error("Error:", error);
        }
    });

    // Llenar preset inicial
    if (presetsPorModo[modeSelect.value.toLowerCase()]) {
        llenarCapturasPorId(presetsPorModo[modeSelect.value.toLowerCase()]);
    }
});