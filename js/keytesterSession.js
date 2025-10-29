const SERVER_URL = "http://10.13.46.195:3000";
const token = localStorage.getItem("token");

// Caso 1: no hay token → login
if (!token) {
    window.location.href = "../index.html";
} else {
    // Caso 2: hay token → verificar con backend
    fetch(`${SERVER_URL}/protected`, {
        method: "GET",
        headers: { "Authorization": token }
    })
    .then(res => {
        if (!res.ok) {
            // Token inválido o expirado
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



    // Función para llenar la tabla
    function llenarCapturasPorId(preset) {
        // Limpia todas las casillas
        document.querySelectorAll("table input[type='number']").forEach(input => input.value = "");

        // Recorre el preset y llena los inputs
        Object.keys(preset).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = preset[id];
            }
        });
    }
    // Configuración con IDs reales del HTML
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
        }
    };

    // Validaciones básicas
    if (!modeSelect) { console.error("No se encontró el select #mode"); return; }
    if (!idA) { console.error("No se encontró el input #idOverrideA"); return; }
    if (!idB) { console.error("No se encontró el input #idOverrideB"); return; }
    if (!idOverride) { console.error("No se encontró el input #idOverride"); return; }
    if (!sproutDiv) { console.error("No se encontró el div #sprout-ids"); return; }
    if (!normalDiv) { console.error("No se encontró el div #normal-id"); return; }

    modeSelect.addEventListener("change", function () {
        const val = this.value.toLowerCase();

        // Mostrar/ocultar parte de Sprout
        if (val === "sprout") {
            sproutDiv.style.display = "block";
            normalDiv.style.display = "none";
            idA.required = true;
            idB.required = true;
            idOverride.required = false;
            idOverride.disabled = true;
            idOverride.value = "";
        } else {
            sproutDiv.style.display = "none";
            normalDiv.style.display = "block";
            idA.required = false;
            idB.required = false;
            idOverride.required = true;
            idOverride.disabled = false;
        }

        // Llenar automáticamente las capturas si hay preset
        if (capturePresets[val]) {
            llenarCapturas(capturePresets[val]);
        }

        console.log("Modo seleccionado:", val, "Sprout visible:", sproutDiv.style.display);
    });

    // --- Envío del formulario ---
    document.getElementById("sessionForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const mode = modeSelect.value.toLowerCase();

        // Validación para Sprout
        if (mode === "sprout") {
            if (!idA.value.trim() || !idB.value.trim()) {
                document.getElementById("message").style.color = "red";
                document.getElementById("message").innerText = "Debes ingresar ambos ID Override para los grupos Sprout.";
                return;
            }
        }

        // Requerimientos de captura
        const captureRequirements = {
            CSVProfile: {
                PS4: parseInt(document.getElementById("csv_ps4").value) || 0,
                "PS4 Dev": parseInt(document.getElementById("csv_ps4dev").value) || 0,
                PS5: parseInt(document.getElementById("csv_ps5").value) || 0,
                "PS5 Dev": parseInt(document.getElementById("csv_ps5dev").value) || 0,
                PC: parseInt(document.getElementById("csv_pc").value) || 0,
                Android: parseInt(document.getElementById("csv_android").value) || 0,
                iOS: parseInt(document.getElementById("csv_ios").value) || 0,
                XSX: parseInt(document.getElementById("csv_xsx").value) || 0,
                Switch: parseInt(document.getElementById("csv_switch").value) || 0
            },
            LLM: {
                "PS4 Dev": parseInt(document.getElementById("llm_ps4dev").value) || 0,
                "PS5 Dev": parseInt(document.getElementById("llm_ps5dev").value) || 0,
                PC: parseInt(document.getElementById("llm_pc").value) || 0,
                Android: parseInt(document.getElementById("llm_android").value) || 0,
                XSX: parseInt(document.getElementById("llm_xsx").value) || 0,
                Switch: parseInt(document.getElementById("llm_switch").value) || 0
            },
            LWM: {
                "PS4 Dev": parseInt(document.getElementById("lwm_ps4dev").value) || 0,
                "PS5 Dev": parseInt(document.getElementById("lwm_ps5dev").value) || 0,
                XSX: parseInt(document.getElementById("lwm_xsx").value) || 0,
                Switch: parseInt(document.getElementById("lwm_switch").value) || 0
            },
            Trace: {
                PC: parseInt(document.getElementById("trace_pc").value) || 0,
                Android: parseInt(document.getElementById("trace_android").value) || 0,
                iOS: parseInt(document.getElementById("trace_ios").value) || 0,
                Switch: parseInt(document.getElementById("trace_switch").value) || 0
            },
            Razor: {
                "PS4 Dev": parseInt(document.getElementById("razor_ps4dev").value) || 0,
                "PS5 Dev": parseInt(document.getElementById("razor_ps5dev").value) || 0,
                XSX: parseInt(document.getElementById("razor_xsx").value) || 0
            },
            DX11: { PC: parseInt(document.getElementById("dx11_pc").value) || 0 },
            DX12: { PC: parseInt(document.getElementById("dx12_pc").value) || 0 },
            Performance: { PC: parseInt(document.getElementById("perf_pc").value) || 0 }
        };

        const data = {
            backendName: document.getElementById("backendName").value,
            buildString: document.getElementById("buildString").value,
            startTime: document.getElementById("startTime").value,
            teamSize: document.getElementById("teamSize").value,
            totalPlayers: parseInt(document.getElementById("totalPlayers").value, 10),
            captureRequirements
        };

        if (mode === "sprout") {
            data.idOverrideA = idA.value;
            data.idOverrideB = idB.value;
        } else {
            data.idOverride = idOverride.value;
        }

        console.log("Data enviada:", data);

        const res = await fetch(`${SERVER_URL}/api/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (res.ok) {
            document.getElementById("message").style.color = "green";
            document.getElementById("message").innerText = "Sesión creada con éxito. Redirigiendo...";
            setTimeout(() => {
                window.location.href = `asignar_sesion.html?sessionId=${result._id}`;
            }, 1200);
        } else {
            document.getElementById("message").style.color = "red";
            document.getElementById("message").innerText = result.message || "Error al crear la sesión";
        }
    });
});