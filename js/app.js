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

    // Botón 1
    const downloadBtn1 = document.createElement("button");
    downloadBtn1.textContent = "Descargar " + p.nombre.toUpperCase();
    styleBtn(downloadBtn1);

    // Botón 2 (si existe url2)
    const downloadBtn2 = document.createElement("button");
    downloadBtn2.textContent = "Descargar " + p.nombre.toUpperCase() + " 2";
    styleBtn(downloadBtn2);

    // Claves independientes para bloqueo
    const lastClickKey1 = `download_${version}_${p.nombre}_url1`;
    const lastClickKey2 = `download_${version}_${p.nombre}_url2`;

    const BLOCK_TIME = 60 * 1000; // 60 segundos

    function updateButton1() {
      const now = Date.now();
      const lastClick = parseInt(localStorage.getItem(lastClickKey1));
      if (lastClick && now - lastClick < BLOCK_TIME) {
        downloadBtn1.disabled = true;
        const remaining = Math.ceil((BLOCK_TIME - (now - lastClick)) / 1000);
        downloadBtn1.textContent = `${p.nombre.toUpperCase()} bloqueado ${remaining}s`;
        return false;
      } else {
        downloadBtn1.disabled = false;
        downloadBtn1.textContent = `Descargar ${p.nombre.toUpperCase()}`;
        return true;
      }
    }

    function updateButton2() {
      const now = Date.now();
      const lastClick = parseInt(localStorage.getItem(lastClickKey2));
      if (lastClick && now - lastClick < BLOCK_TIME) {
        downloadBtn2.disabled = true;
        const remaining = Math.ceil((BLOCK_TIME - (now - lastClick)) / 1000);
        downloadBtn2.textContent = `${p.nombre.toUpperCase()} 2 bloqueado ${remaining}s`;
        return false;
      } else {
        downloadBtn2.disabled = false;
        downloadBtn2.textContent = `Descargar ${p.nombre.toUpperCase()} 2`;
        return true;
      }
    }

    // Actualizar estado inicial y cada segundo
    updateButton1();
    updateButton2();
    setInterval(updateButton1, 1000);
    setInterval(updateButton2, 1000);

    // Eventos click
    downloadBtn1.addEventListener("click", () => {
      if (!updateButton1()) return;
      if (p.url) {
        window.open(p.url, "_blank");
        localStorage.setItem(lastClickKey1, Date.now());
        updateButton1();
      }
    });

    downloadBtn2.addEventListener("click", () => {
      if (!updateButton2()) return;
      if (p.url2) {
        window.open(p.url2, "_blank");
        localStorage.setItem(lastClickKey2, Date.now());
        updateButton2();
      }
    });

    // Render en el DOM
    div.innerHTML = `
      <img src="./iconos/${p.nombre}.png" alt="${p.nombre}">
      <h3>${p.nombre.toUpperCase()}</h3>
      <div class="status">
        Activo: ${p.servidor_archivos ? "🟢" : "🔴"}
      </div>
    `;
    div.appendChild(downloadBtn1);
    if (p.url2) div.appendChild(downloadBtn2); // Sólo si hay segunda URL

    container.appendChild(div);
  });

  // Función para estilizar botones
  function styleBtn(btn) {
    btn.style.marginTop = "10px";
    btn.style.padding = "6px 18px";
    btn.style.borderRadius = "6px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.background = "linear-gradient(90deg, #007bff, #00c9ff)";
    btn.style.color = "white";
  }
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

// === Chart.js Estadísticas Dinámicas ===
let chartInstance = null;
let statsInterval = null;

/**
 * Obtiene y organiza los datos desde el JSON
 */
async function fetchStatsData() {
  try {
    const res = await fetch("/static/output_data.json");
    if (!res.ok) throw new Error("No se pudo obtener el JSON");
    const data = await res.json();

    // Obtener archivos únicos y usuarios únicos
    const archivos = [...new Set(data.map(item => item.archivo))];
    const usuarios = [...new Set(data.map(item => item.usuario))];

    // Generar un dataset por cada archivo
    const datasets = archivos.map((archivo, i) => {
      const color = `hsl(${(i * 60) % 360}, 70%, 55%)`; // paleta automática

      const valores = usuarios.map(usuario => {
        const registro = data.find(
          item => item.usuario === usuario && item.archivo === archivo
        );
        return registro ? registro.porcentaje_total : 0;
      });

      return {
        label: archivo.split("/").pop(), // muestra solo el nombre del archivo
        data: valores,
        backgroundColor: color,
        borderColor: color.replace("55%", "45%"),
        borderWidth: 1
      };
    });

    return { usuarios, datasets };
  } catch (err) {
    console.error("❌ Error cargando datos:", err);
    return { usuarios: [], datasets: [] };
  }
}

/**
 * Renderiza un gráfico dinámico con Chart.js
 */
async function renderStatsChart() {
  const ctx = document.getElementById("statsChart")?.getContext("2d");
  if (!ctx) {
    console.warn("⚠️ No se encontró el canvas #statsChart");
    return;
  }

  const { usuarios, datasets } = await fetchStatsData();

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels: usuarios, datasets },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          max: 110,
          title: { display: true, text: "Porcentaje de Descarga (%)" },
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff" }
        },
        x: {
          title: { display: true, text: "Usuario / Dispositivo" },
          ticks: { color: "#fff", autoSkip: false, maxRotation: 45, minRotation: 45 },
          grid: { color: "rgba(255,255,255,0.1)" },
          stacked: true // ✅ cambia a false si prefieres barras separadas
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#fff" }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`
          }
        }
      }
    }
  });
}

/**
 * Control de modal para estadísticas
 */
document.querySelector('[data-modal="modal-stats"]').addEventListener("click", async () => {
  const modal = document.getElementById("modal-stats");
  modal.style.display = "flex";

  await renderStatsChart(); // render inicial
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(renderStatsChart, 10000); // recarga cada 10s
});

document.querySelector("#modal-stats .close-btn").addEventListener("click", () => {
  document.getElementById("modal-stats").style.display = "none";
  if (statsInterval) clearInterval(statsInterval);
});