document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("editor-container");

  function renderPlataformasEdit() {
    container.innerHTML = "";

    buildsData.plataformas.forEach((p, index) => {
      const div = document.createElement("div");
      div.classList.add("plataforma-item");

      div.innerHTML = `
        <h3>${p.nombre.toUpperCase()}</h3>
        <label>
          Activo:
          <input type="checkbox" class="servidor-archivos" ${p.servidor_archivos ? "checked" : ""}>
        </label>
        <label>
          URL:
          <input type="text" class="url-input" value="${p.url}">
        </label>
        <button class="save-btn">Guardar</button>
      `;

      // Guardar cambios en memoria
      div.querySelector(".save-btn").addEventListener("click", () => {
        p.servidor_archivos = div.querySelector(".servidor-archivos").checked;
        p.url = div.querySelector(".url-input").value;

        alert(`✔ Cambios guardados en ${p.nombre}`);
        console.log(buildsData);
      });

      container.appendChild(div);
    });
  }

  renderPlataformasEdit();

  // Exportar JSON actualizado
  document.getElementById("export-btn").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildsData, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "serverurl.json");
    dlAnchor.click();
  });
});
