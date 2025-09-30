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

// Render builds con estado de servidores
function renderPlataformas() {
  const container = document.getElementById("plataformas-container");
  container.innerHTML = "";

  buildsData.plataformas.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("plataforma");

    div.innerHTML = `
      <a href="${p.url}" target="_blank">
        <img src="./iconos/${p.nombre}.png" alt="${p.nombre}">
      </a>
      <h3>${p.nombre.toUpperCase()}</h3>
      <div class="status">
        Servidor Archivos: ${p.servidor_archivos ? "🟢" : "🔴"}<br>
        Servidor Plataforma: ${p.servidor_plataforma ? "🟢" : "🔴"}
      </div>
    `;

    container.appendChild(div);
  });
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

