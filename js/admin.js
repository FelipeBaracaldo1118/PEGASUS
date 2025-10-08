document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://10.13.46.195:3000";
  const container = document.getElementById("edit-form");
  const versionSelector = document.getElementById("version-selector");
  const newVersionInput = document.getElementById("new-version");
  const createVersionBtn = document.getElementById("create-version-btn");

  // 👉 Inicialización
  let currentVersion = Object.keys(buildsData.versiones)[0];
  renderVersionOptions();
  renderPlataformasEdit(currentVersion);
  renderDeleteVersionControl();

  // RENDER VERSIÓNES EN SELECTOR
  function renderVersionOptions() {
    versionSelector.innerHTML = "";
    Object.keys(buildsData.versiones).forEach(ver => {
      const opt = document.createElement("option");
      opt.value = ver;
      opt.textContent = ver;
      versionSelector.appendChild(opt);
    });
    versionSelector.value = currentVersion;
  }

  // CAMBIAR ENTRE VERSIONES
  versionSelector.addEventListener("change", () => {
    currentVersion = versionSelector.value;
    renderPlataformasEdit(currentVersion);
  });

  // CREAR NUEVA VERSIÓN
  createVersionBtn.addEventListener("click", () => {
    const newVer = newVersionInput.value.trim();
    if (!newVer) return alert("Debes ingresar un número de versión");
    if (buildsData.versiones[newVer]) return alert("Esa versión ya existe");

    // Plantilla base
    const basePlataformas = [
      { nombre: "xsx", servidor_archivos: true, url: "test" },
      { nombre: "switch", servidor_archivos: true, url: "test" },
      { nombre: "ps4", servidor_archivos: true, url: "test" },
      { nombre: "ps5", servidor_archivos: true, url: "test" }
    ];

    buildsData.versiones[newVer] = JSON.parse(JSON.stringify(basePlataformas));
    renderVersionOptions();
    versionSelector.value = newVer;
    currentVersion = newVer;
    renderPlataformasEdit(newVer);
    renderDeleteVersionControl();

    alert(`✅ Versión ${newVer} creada correctamente`);
  });

  // RENDER DE PLATAFORMAS
  function renderPlataformasEdit(version) {
    container.innerHTML = "";
    const plataformas = buildsData.versiones[version];

    plataformas.forEach((p) => {
      const div = document.createElement("div");
      div.classList.add("plataforma-card");

      div.innerHTML = `
        <h3>${p.nombre.toUpperCase()}</h3>
        <label>
          <input type="checkbox" class="servidor-archivos" ${p.servidor_archivos ? "checked" : ""}>
          Activo
        </label>
        <label>
          URL:
          <input type="text" class="url-input" value="${p.url}">
        </label>
      `;

      div.querySelector(".servidor-archivos").addEventListener("change", (e) => {
        p.servidor_archivos = e.target.checked;
      });

      div.querySelector(".url-input").addEventListener("input", (e) => {
        p.url = e.target.value;
      });

      container.appendChild(div);
    });
  }

  // CONTROL DE ELIMINAR VERSIÓN
  function renderDeleteVersionControl() {
    let deleteContainer = document.getElementById("delete-version-container");
    if (!deleteContainer) {
      deleteContainer = document.createElement("div");
      deleteContainer.id = "delete-version-container";
      deleteContainer.style.marginTop = "20px";
      deleteContainer.style.gridColumn = "1 / -1"; // ocupar todo el ancho
      container.prepend(deleteContainer);
    }

    deleteContainer.innerHTML = `
      <label>Eliminar versión:
        <select id="delete-version-select"></select>
      </label>
      <button id="delete-version-btn">Eliminar</button>
    `;

    const select = document.getElementById("delete-version-select");
    select.innerHTML = "";
    Object.keys(buildsData.versiones).forEach(ver => {
      const opt = document.createElement("option");
      opt.value = ver;
      opt.textContent = ver;
      select.appendChild(opt);
    });

    const deleteBtn = document.getElementById("delete-version-btn");
    deleteBtn.addEventListener("click", () => {
      const verToDelete = select.value;
      if (!verToDelete) return;
      if (!confirm(`¿Eliminar la versión ${verToDelete}? Esto no se puede deshacer.`)) return;

      delete buildsData.versiones[verToDelete];

      // Ajustar versión actual si se eliminó
      const remainingVersions = Object.keys(buildsData.versiones);
      currentVersion = remainingVersions[0] || "";
      renderVersionOptions();
      renderPlataformasEdit(currentVersion);
      renderDeleteVersionControl();

      alert(`❌ Versión ${verToDelete} eliminada`);
    });
  }

  // EXPORTAR JSON
  document.getElementById("export-btn").addEventListener("click", () => {
    fetch(`${API_URL}/save-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildsData),
    })
      .then((res) => res.text())
      .then((msg) => alert("✅ JSON actualizado en serverurl.js\n" + msg))
      .catch((err) => {
        console.error("❌ Error al guardar:", err);
        alert("❌ Error al guardar el archivo");
      });
  });
});
