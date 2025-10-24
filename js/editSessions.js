
    const SERVER_URL = "http://10.13.46.195:3000";
    const sessionId = new URLSearchParams(window.location.search).get('id');
    const token = localStorage.getItem("token");

    // Cargar los datos de la sesión
    async function loadSessionData() {
      try {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
          headers: { "Authorization": token }
        });

        if (!response.ok) throw new Error('Error al cargar la sesión');

        const session = await response.json();

        // Rellenar el formulario con los datos de la sesión
        document.getElementById("commsLead").value = session.commsLead;
        document.getElementById("commsAssist").value = session.commsAssist;
        document.getElementById("backendName").value = session.backendName;
        document.getElementById("buildString").value = session.buildString;
        document.getElementById("googleDrive").value = session.googleDrive;
        document.getElementById("gameModes").value = session.gameModes;
        document.getElementById("idOverride").value = session.idOverride;
        document.getElementById("startTime").value = session.startTime;
        document.getElementById("premadeTeams").value = session.premadeTeams;
        document.getElementById("teamSize").value = session.teamSize;
        document.getElementById("testPlan").value = session.testPlan;
        document.getElementById("totalPlayers").value = session.totalPlayers;

        // Rellenar los requerimientos de captura
        const captureReq = session.captureRequirements || {};
        
        // CSVProfile
        if (captureReq.CSVProfile) {
          document.getElementById("csv_ps4").value = captureReq.CSVProfile.PS4 || 0;
          document.getElementById("csv_ps4dev").value = captureReq.CSVProfile["PS4 Dev"] || 0;
          document.getElementById("csv_ps5").value = captureReq.CSVProfile.PS5 || 0;
          document.getElementById("csv_ps5dev").value = captureReq.CSVProfile["PS5 Dev"] || 0;
          document.getElementById("csv_pc").value = captureReq.CSVProfile.PC || 0;
          document.getElementById("csv_android").value = captureReq.CSVProfile.Android || 0;
          document.getElementById("csv_ios").value = captureReq.CSVProfile.iOS || 0;
          document.getElementById("csv_xsx").value = captureReq.CSVProfile.XSX || 0;
          document.getElementById("csv_switch").value = captureReq.CSVProfile.Switch || 0;
        }

        // LLM
        if (captureReq.LLM) {
          document.getElementById("llm_ps4dev").value = captureReq.LLM["PS4 Dev"] || 0;
          document.getElementById("llm_ps5dev").value = captureReq.LLM["PS5 Dev"] || 0;
          document.getElementById("llm_pc").value = captureReq.LLM.PC || 0;
          document.getElementById("llm_android").value = captureReq.LLM.Android || 0;
          document.getElementById("llm_xsx").value = captureReq.LLM.XSX || 0;
          document.getElementById("llm_switch").value = captureReq.LLM.Switch || 0;
        }

        // LWM
        if (captureReq.LWM) {
          document.getElementById("lwm_ps4dev").value = captureReq.LWM["PS4 Dev"] || 0;
          document.getElementById("lwm_ps5dev").value = captureReq.LWM["PS5 Dev"] || 0;
          document.getElementById("lwm_xsx").value = captureReq.LWM.XSX || 0;
          document.getElementById("lwm_switch").value = captureReq.LWM.Switch || 0;
        }

        // Trace
        if (captureReq.Trace) {
          document.getElementById("trace_pc").value = captureReq.Trace.PC || 0;
          document.getElementById("trace_android").value = captureReq.Trace.Android || 0;
          document.getElementById("trace_ios").value = captureReq.Trace.iOS || 0;
          document.getElementById("trace_switch").value = captureReq.Trace.Switch || 0;
        }


      } catch (error) {
        document.getElementById("message").innerText = "Error al cargar los datos de la sesión";
        console.error(error);
      }
    }

    // Manejar el envío del formulario
    document.getElementById("editSessionForm").addEventListener("submit", async function(e) {
      e.preventDefault();

      // Construir el objeto de requerimientos de captura
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
        }
      };

            const data = {
        commsLead: document.getElementById("commsLead").value,
        commsAssist: document.getElementById("commsAssist").value,
        backendName: document.getElementById("backendName").value,
        buildString: document.getElementById("buildString").value,
        googleDrive: document.getElementById("googleDrive").value,
        gameModes: document.getElementById("gameModes").value,
        idOverride: document.getElementById("idOverride").value,
        startTime: document.getElementById("startTime").value,
        premadeTeams: document.getElementById("premadeTeams").value,
        teamSize: document.getElementById("teamSize").value,
        testPlan: document.getElementById("testPlan").value,
        totalPlayers: parseInt(document.getElementById("totalPlayers").value),
        captureRequirements
      };

      try {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error('Error al actualizar la sesión');
        }

        const result = await response.json();
        document.getElementById("message").style.color = "green";
        document.getElementById("message").innerText = "Sesión actualizada con éxito";
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000);

      } catch (error) {
        document.getElementById("message").style.color = "red";
        document.getElementById("message").innerText = "Error al actualizar la sesión: " + error.message;
      }
    });

    // Cargar los datos cuando se carga la página
    if (!sessionId) {
      document.getElementById("message").innerText = "ID de sesión no proporcionado";
    } else {
      loadSessionData();
    }
  