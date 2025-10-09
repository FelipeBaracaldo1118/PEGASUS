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

// Render builds con estado de servidores y limitación de descarga
function renderPlataformas() {
  const container = document.getElementById("plataformas-container");
  const modalBuilds = document.getElementById("modal-builds");
  container.innerHTML = "";

  // 🔸 Crear dropdown de versiones si no existe
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

  // 🔹 Renderizar la primera versión por defecto
  const defaultVersion = Object.keys(buildsData.versiones)[0];
  renderVersion(defaultVersion);

  // 🔹 Cambiar versión al seleccionar
  versionSelect.addEventListener("change", () => {
    renderVersion(versionSelect.value);
  });

  // 🔹 Función para renderizar una versión
  function renderVersion(version) {
    container.innerHTML = "";
    const plataformas = buildsData.versiones[version];

    plataformas.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("plataforma");

      // Crear botón de descarga con límite
      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Descargar " + p.nombre.toUpperCase();
      downloadBtn.style.marginTop = "10px";
      downloadBtn.style.padding = "6px 12px";
      downloadBtn.style.borderRadius = "6px";
      downloadBtn.style.border = "none";
      downloadBtn.style.cursor = "pointer";
      downloadBtn.style.background = "linear-gradient(90deg, #007bff, #00c9ff)";
      downloadBtn.style.color = "white";
      ////// 2 button test 

      const downloadBtn2 = document.createElement("button");
      downloadBtn2.textContent = "Descargar " + p.nombre.toUpperCase() + " 2";
      downloadBtn2.style.marginTop = "10px";
      downloadBtn2.style.padding = "6px 25px";
      downloadBtn2.style.borderRadius = "6px";
      downloadBtn2.style.border = "none";
      downloadBtn2.style.cursor = "pointer";
      downloadBtn2.style.background = "linear-gradient(90deg, #007bff, #00c9ff)";
      downloadBtn2.style.color = "white";

      const lastClickKey = `download_${version}_${p.nombre}`;
      const lastClickKey2 = `download_${version}_${p.nombre}`;

      // Función para actualizar el botón según tiempo restante
      function updateButton() {
        const now = Date.now();
        const lastClick = parseInt(localStorage.getItem(lastClickKey));
        if (lastClick && now - lastClick < 10 * 6 * 1000) {
          downloadBtn.disabled = true;
          const remaining = Math.ceil((10 * 6 * 1000 - (now - lastClick)) / 1000);
          downloadBtn.textContent = `${p.nombre.toUpperCase()} Download  (will be available after ${remaining}s)`;
          return false;
        } else {
          downloadBtn.disabled = false;
          downloadBtn.textContent = "Download " + p.nombre.toUpperCase();
          return true;
        }
      }
      
      function updateButton2() {
        const now = Date.now();
        const lastClick2 = parseInt(localStorage.getItem(lastClickKey2));
        if (lastClick2 && now - lastClick2 < 10 * 6 * 1000) {
          downloadBtn2.disabled = true;
          const remaining2 = Math.ceil((10 * 6 * 1000 - (now - lastClick2)) / 1000);
          downloadBtn2.textContent = `${p.nombre.toUpperCase()} Download  (will be available after ${remaining2}s)`;
          return false;
        } else {
          downloadBtn2.disabled = false;
          downloadBtn2.textContent = "Download " + p.nombre.toUpperCase() + " 2";
          return true;
        }
      }


      // Inicializar estado del botón
      updateButton();

      updateButton2();

      // Intervalo para actualizar cada segundo
      const interval = setInterval(updateButton, 1000);
      const interval2 = setInterval(updateButton, 1000);
      

      // Evento click
      downloadBtn.addEventListener("click", () => {
        if (!updateButton()) return; // aún bloqueado

        window.open(p.url, "_blank");
        localStorage.setItem(lastClickKey, Date.now());
        updateButton();
      });

      downloadBtn2.addEventListener("click", () => {
        if (!updateButton2()) return; // aún bloqueado

        window.open(p.url2, "_blank");
        localStorage.setItem(lastClickKey2, Date.now());
        updateButton2();
      });

      div.innerHTML = `
          <img src="./iconos/${p.nombre}.png" alt="${p.nombre}">
        </a>
        <h3>${p.nombre.toUpperCase()}</h3>
        <div class="status">
          Activo: ${p.servidor_archivos ? "🟢" : "🔴"}
        </div>
      `;

      div.appendChild(downloadBtn);


      div.appendChild(downloadBtn2);

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

    // Crear submodal para cada plataforma
    const nestedModal = document.createElement("div");
    nestedModal.classList.add("modal");
    nestedModal.id = `install-${p.nombre}`;
    nestedModal.style.zIndex = "2000";
    nestedModal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>Instalar ${p.nombre.toUpperCase()}</h2>
        <p>Descarga la build en tu pc y sigue el proceso desde el instalador de tu consola ${p.nombre}.</p>
      </div>
    `;

    nestedContainer.appendChild(nestedModal);
  });

  //Render Commnads Builder




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

