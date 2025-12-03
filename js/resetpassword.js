// js/resetPassword.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const resetForm = document.getElementById('resetPasswordForm');
  const toggleFormBtn = document.getElementById('toggleForm');
  const forgotPasswordBtn = document.getElementById('forgotPassword');
  const messageEl = document.getElementById('message');

  let currentForm = 'login'; // login, register, reset

  // Toggle entre login y registro
  toggleFormBtn.addEventListener('click', () => {
    if (currentForm === 'login') {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      resetForm.style.display = 'none';
      toggleFormBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';
      forgotPasswordBtn.style.display = 'none';
      currentForm = 'register';
    } else {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      resetForm.style.display = 'none';
      toggleFormBtn.textContent = '¿No tienes cuenta? Regístrate';
      forgotPasswordBtn.style.display = 'block';
      currentForm = 'login';
    }
    messageEl.textContent = '';
  });

  // Mostrar formulario de recuperación
  forgotPasswordBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    resetForm.style.display = 'block';
    toggleFormBtn.textContent = 'Volver al login';
    forgotPasswordBtn.style.display = 'none';
    currentForm = 'reset';
    messageEl.textContent = '';
    
    // Resetear pasos
    document.getElementById('reset-step-1').style.display = 'block';
    document.getElementById('reset-step-2').style.display = 'none';
    document.getElementById('reset-step-3').style.display = 'none';
  });

  // Step 1: Verificar usuario
  document.getElementById('verify-user-btn').addEventListener('click', async () => {
    const username = document.getElementById('reset-username').value.trim();
    
    if (!username) {
      showMessage('Por favor ingresa tu usuario', 'error');
      return;
    }

    try {
      const response = await fetch('/api/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.totpEnabled) {
          document.getElementById('reset-step-1').style.display = 'none';
          document.getElementById('reset-step-2').style.display = 'block';
          showMessage('Usuario verificado. Ingresa tu código TOTP', 'success');
        } else {
          showMessage('Este usuario no tiene 2FA configurado. Contacta al administrador.', 'error');
        }
      } else {
        showMessage(data.error || 'Usuario no encontrado', 'error');
      }
    } catch (error) {
      showMessage('Error de conexión', 'error');
      console.error(error);
    }
  });

  // Step 2: Verificar TOTP
  document.getElementById('verify-totp-btn').addEventListener('click', async () => {
    const username = document.getElementById('reset-username').value.trim();
    const totpCode = document.getElementById('totp-code').value.trim();

    if (!totpCode || totpCode.length !== 6) {
      showMessage('Ingresa un código válido de 6 dígitos', 'error');
      return;
    }

    try {
      const response = await fetch('/api/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, totpCode })
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById('reset-step-2').style.display = 'none';
        document.getElementById('reset-step-3').style.display = 'block';
        showMessage('Código verificado. Ingresa tu nueva contraseña', 'success');
      } else {
        showMessage(data.error || 'Código TOTP inválido', 'error');
      }
    } catch (error) {
      showMessage('Error de conexión', 'error');
      console.error(error);
    }
  });

  // Step 3: Restablecer contraseña
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reset-username').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showMessage('Las contraseñas no coinciden', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('✓ Contraseña restablecida exitosamente. Redirigiendo...', 'success');
        setTimeout(() => {
          loginForm.style.display = 'block';
          resetForm.style.display = 'none';
          toggleFormBtn.textContent = '¿No tienes cuenta? Regístrate';
          forgotPasswordBtn.style.display = 'block';
          currentForm = 'login';
          resetForm.reset();
        }, 2000);
      } else {
        showMessage(data.error || 'Error al restablecer contraseña', 'error');
      }
    } catch (error) {
      showMessage('Error de conexión', 'error');
      console.error(error);
    }
  });

  function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.style.color = type === 'success' ? '#4ade80' : '#f87171';
  }
});