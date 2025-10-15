document.getElementById('year').textContent = new Date().getFullYear();

// Slider
const slides = document.querySelectorAll('.slide');
let current = 0;

const fadeInTime = 2500;
const visibleTime = 10000;
const fadeOutTime = 1000;

function showSlide(index) {
  const slide = slides[index];
  slide.classList.add("fade-in");

  setTimeout(() => {
    slide.classList.remove("fade-in");
    slide.classList.add("fade-out");

    setTimeout(() => {
      slide.classList.remove("fade-out");
      current = (index + 1) % slides.length;
      showSlide(current);
    }, fadeOutTime);

  }, visibleTime);
}

slides[current].classList.add("fade-in");

setTimeout(() => {
  slides[current].classList.remove("fade-in");
  slides[current].classList.add("fade-out");

  setTimeout(() => {
    slides[current].classList.remove("fade-out");
    current = (current + 1) % slides.length;
    showSlide(current);
  }, fadeOutTime);

}, visibleTime);

// Modals
const options = document.querySelectorAll('.option');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-btn');

options.forEach(option => {
  option.addEventListener('click', () => {
    const modalId = option.getAttribute('data-modal');
    document.getElementById(modalId).style.display = 'flex';

    if (modalId === "modal-builds") {
      renderPlataformas();
    } else if (modalId === "modal-install") {
      renderInstallPlataformas();
    }
  });
});

closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  modals.forEach(modal => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

// Render builds con estado de servidores y botón único con control de bloqueo por enlace
function renderPlataformas() {
  const container = document.getElementById("plataformas-container");
  const modalBuilds = document.getElementById("modal-builds");
  container.innerHTML = "";

  // Crear dropdown de versiones si no existe
  let versionSelect = document.getElementById("version-select");
  if (!versionSelect) {
    versionSelect = document.createElement("select");
    versionSelect.id = "version-select";
    versionSelect.style.marginBottom = "15px";
    versionSelect.style.padding = "6px";
    versionSelect.style.fontSize = "1rem";
    versionSelect.style.borderRadius = "8px";
    versionSelect.style.border = "none";
    versionSelect.style.background = "rgba(255,255,255,0.15)";
    versionSelect.style.color = "white";

    modalBuilds.querySelector(".modal-content").insertBefore(versionSelect, container);

    // Agregar versiones disponibles
    Object.keys(buildsData.versiones).forEach(ver => {
      const opt = document.createElement("option");
      opt.value = ver;
      opt.textContent = "Versión " + ver;
      versionSelect.appendChild(opt);
    });
  }

  // Renderizar la primera versión por defecto
  const defaultVersion = Object.keys(buildsData.versiones)[0];
  renderVersion(defaultVersion);

  versionSelect.addEventListener("change", () => {
    renderVersion(versionSelect.value);
  });

  function renderVersion(version) {
    container.innerHTML = "";
    const plataformas = buildsData.versiones[version];

    plataformas.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("plataforma");

      // Botón único
      const downloadBtn = document.createElement("button");
      downloadBtn.style.marginTop = "10px";
      downloadBtn.style.padding = "6px 12px";
      downloadBtn.style.borderRadius = "6px";
      downloadBtn.style.border = "none";
      downloadBtn.style.cursor = "pointer";
      downloadBtn.style.background = "linear-gradient(90deg, #007bff, #00c9ff)";
      downloadBtn.style.color = "white";

      // Botón para alternar URL 1 / URL 2
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "Cambiar enlace";
      toggleBtn.style.marginLeft = "10px";
      toggleBtn.style.padding = "6px 12px";
      toggleBtn.style.borderRadius = "6px";
      toggleBtn.style.border = "none";
      toggleBtn.style.cursor = "pointer";
      toggleBtn.style.background = "linear-gradient(90deg, #28a745, #88ff88)";
      toggleBtn.style.color = "white";

      const lastClickKey1 = `download_${version}_${p.nombre}_url1`;
      const lastClickKey2 = `download_${version}_${p.nombre}_url2`;
      const BLOCK_TIME = 60 * 1000; // 60 segundos
      let currentMode = 1; // Modo actual: 1 o 2

      function updateButton() {
        const now = Date.now();
        const key = currentMode === 1 ? lastClickKey1 : lastClickKey2;
        const lastClick = parseInt(localStorage.getItem(key));

        if (lastClick && now - lastClick < BLOCK_TIME) {
          downloadBtn.disabled = true;
          const remaining = Math.ceil((BLOCK_TIME - (now - lastClick)) / 1000);
          downloadBtn.textContent = `${p.nombre.toUpperCase()} (${currentMode}) bloqueado ${remaining}s`;
          return false;
        } else {
          downloadBtn.disabled = false;
          downloadBtn.textContent = `Descargar ${p.nombre.toUpperCase()} (${currentMode})`;
          return true;
        }
      }

      setInterval(updateButton, 1000);
      updateButton();

      downloadBtn.addEventListener("click", () => {
        if (!updateButton()) return;

        const url = currentMode === 1 ? p.url : p.url2;
        const key = currentMode === 1 ? lastClickKey1 : lastClickKey2;

        window.open(url, "_blank");
        localStorage.setItem(key, Date.now());
        updateButton();
      });

      toggleBtn.addEventListener("click", () => {
        currentMode = currentMode === 1 ? 2 : 1;
        updateButton();
      });

      div.innerHTML = `
        <img src="./iconos/${p.nombre}.png" alt="${p.nombre}">
        <h3>${p.nombre.toUpperCase()}</h3>
        <div class="status">
          Activo: ${p.servidor_archivos ? "🟢" : "🔴"}
        </div>
      `;

      div.appendChild(downloadBtn);
      div.appendChild(toggleBtn);
      container.appendChild(div);
    });
  }
}

// Render instalación con submodals
function renderInstallPlataformas() {
  const container = document.getElementById("install-container");
  const nestedContainer = document.getElementById("nested-modals");
  container.innerHTML = "";
  nestedContainer.innerHTML = "";

  buildsData.plataformas.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("plataforma");

    div.innerHTML = `
      <div data-modal="install-${p.nombre}">
        <img src="./iconos/${p.nombre}.png" alt="${p.nombre}">
        <h3>${p.nombre.toUpperCase()}</h3>
      </div>
    `;

    container.appendChild(div);

    const nestedModal = document.createElement("div");
    nestedModal.classList.add("modal");
    nestedModal.id = `install-${p.nombre}`;
    nestedModal.style.zIndex = "2000";
    nestedModal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>Instalar ${p.nombre.toUpperCase()}</h2>
        <p>Descarga la build en tu PC y sigue el proceso desde el instalador de tu consola ${p.nombre}.</p>
      </div>
    `;

    nestedContainer.appendChild(nestedModal);
  });

  // Abrir submodals
  document.querySelectorAll('#install-container [data-modal]').forEach(item => {
    item.addEventListener('click', () => {
      const modalId = item.getAttribute('data-modal');
      document.getElementById(modalId).style.display = 'flex';
    });
  });

  // Cerrar submodals
  document.querySelectorAll('#nested-modals .close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });
}