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
            teamSize: document.getElementById("teamSize").value,
            totalPlayers: +document.getElementById("totalPlayers").value,
            captureRequirements,
            sessionType // 🔹 ahora solo puede ser "normal", "sprout", "juno" o "sparks"
        };

        if (usaSproutLayout) {
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
        const msg = document.getElementById("message");

        if (res.ok) {
            msg.style.color = "green";
            msg.innerText = "Sesión creada con éxito. Redirigiendo...";
            setTimeout(() => {
                window.location.href = `asignar_sesion.html?sessionId=${result._id}`;
            }, 1200);
        } else {
            msg.style.color = "red";
            msg.innerText = result.message || "Error al crear la sesión";
        }
    });

    // Llenar preset inicial
    if (presetsPorModo[modeSelect.value.toLowerCase()]) {
        llenarCapturasPorId(presetsPorModo[modeSelect.value.toLowerCase()]);
    }
});
