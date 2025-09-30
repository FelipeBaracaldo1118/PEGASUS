document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  // 👉 Configura aquí la URL de tu API Node
  const API_URL = "http://localhost:3000"; // cámbialo si es necesario

  const options = document.querySelectorAll(".option");
  const modals = document.querySelectorAll(".modal");
  const closeButtons = document.querySelectorAll(".close-btn");

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const modalId = option.getAttribute("data-modal");
      document.getElementById(modalId).style.display = "flex";

      if (modalId === "modal-builds") {
        renderPlataformasEdit();
      }
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    modals.forEach((modal) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  // Render editable con tarjetas (sin botón guardar)
  function renderPlataformasEdit() {
    const container = document.getElementById("edit-form");
    container.innerHTML = "";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
    container.style.gap = "20px";

    buildsData.plataformas.forEach((p) => {
      const div = document.createElement("div");
      div.classList.add("plataforma-card");

      div.innerHTML = `
        <h3>${p.nombre.toUpperCase()}</h3>
        <label>
          <input type="checkbox" class="servidor-archivos" ${
            p.servidor_archivos ? "checked" : ""
          }>
          Servidor Archivos
        </label>
        <label>
          <input type="checkbox" class="servidor-plataforma" ${
            p.servidor_plataforma ? "checked" : ""
          }>
          Servidor Plataforma
        </label>
        <label>
          URL:
          <input type="text" class="url-input" value="${p.url}">
        </label>
      `;

      // Guardar cambios al instante
      div.querySelector(".servidor-archivos").addEventListener("change", (e) => {
        p.servidor_archivos = e.target.checked;
      });

      div.querySelector(".servidor-plataforma").addEventListener("change", (e) => {
        p.servidor_plataforma = e.target.checked;
      });

      div.querySelector(".url-input").addEventListener("input", (e) => {
        p.url = e.target.value;
      });

      container.appendChild(div);
    });
  }

  // Exportar JSON al servidor
  document.getElementById("export-btn").addEventListener("click", () => {
    fetch(`${API_URL}/save-json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildsData),
    })
      .then((res) => res.text()) // 👈 usamos .text() en lugar de .json()
      .then((msg) => {
        alert("✅ JSON actualizado correctamente en serverurl.js\n" + msg);
      })
      .catch((err) => {
        console.error("❌ Error al guardar:", err);
        alert("❌ Error al guardar el archivo en el servidor");
      });
  });
});
