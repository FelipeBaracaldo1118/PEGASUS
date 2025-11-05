// ===============================
// Pegasus - Profile.js Final
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 Cargando perfil...");

  // ✅ 1. Obtener token desde localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("⚠️ No se encontró token. Redirigiendo al login...");
    window.location.href = "/index.html";
    return;
  }

  // ✅ 2. Función para obtener los datos del usuario
  async function fetchUserData() {
    try {
      const res = await fetch("http://localhost:3000/api/user/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        console.error("❌ Error HTTP:", res.status);
        if (res.status === 401 || res.status === 403) {
          alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
          localStorage.removeItem("token");
          window.location.href = "/index.html";
          return;
        }
        throw new Error(`Error ${res.status}`);
      }

      const user = await res.json();
      console.log("✅ Usuario cargado:", user);

      renderProfile(user);
    } catch (error) {
      console.error("❌ Error al obtener el perfil:", error);
      alert("Error al obtener la información del perfil. Intenta iniciar sesión nuevamente.");
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    }
  }

  // ✅ 3. Renderizar los datos en pantalla
  function renderProfile(user) {
    const container = document.getElementById("profile-info");
    if (!container) return;

    container.innerHTML = `
      <div class="profile-card glass">
        <h2>👤 Perfil de Usuario</h2>
        <p><strong>Usuario:</strong> ${user.Epam_user || user.username}</p>
        <p><strong>Tipo:</strong> ${user.userType || "tester"}</p>
        <p><strong>Pod:</strong> ${user.Pod || "N/A"}</p>
        <p><strong>Región:</strong> ${user.Region || "N/A"}</p>
        <p><strong>Estación:</strong> ${user.Station || "N/A"}</p>
        <p><strong>Disponibilidad:</strong> ${user.availability || "Desconocida"}</p>
        <button id="logoutBtn" class="logout-btn">Cerrar sesión</button>
      </div>
    `;

    // ✅ 4. Botón de logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    });
  }

  // ✅ 5. Llamar a la función principal
  await fetchUserData();
});
