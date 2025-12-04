// js/totp.js

// ✅ DEFINIR SERVER_URL AL INICIO

document.addEventListener('DOMContentLoaded', () => {
  const setup2faBtn = document.getElementById('setup2faBtn');
  const totpModal = document.getElementById('totp-modal');
  const closeTotpModal = document.getElementById('close-totp-modal');
  const enableTotpBtn = document.getElementById('enable-totp-btn');
  const disableTotpBtn = document.getElementById('disable-totp-btn');

  let currentSecret = '';

  // ✅ Abrir modal
  setup2faBtn.addEventListener('click', async () => {
    try {
      // ✅ CAMBIO: Usar SERVER_URL
      const response = await fetch(`${SERVER_URL}/api/generate-totp`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        currentSecret = data.secret;
        document.getElementById('totp-secret').textContent = data.secret;
        document.getElementById('qr-container').innerHTML = `<img src="${data.qrCode}" alt="QR Code" style="max-width: 250px;">`;
        
        // Mostrar botón correcto según estado
        if (data.totpEnabled) {
          enableTotpBtn.style.display = 'none';
          disableTotpBtn.style.display = 'block';
        } else {
          enableTotpBtn.style.display = 'block';
          disableTotpBtn.style.display = 'none';
        }

        totpModal.style.display = 'flex';
      } else {
        alert(data.error || 'Error al generar código 2FA');
      }
    } catch (error) {
      alert('Error al generar código 2FA');
      console.error(error);
    }
  });

  // ✅ Cerrar modal
  closeTotpModal.addEventListener('click', () => {
    totpModal.style.display = 'none';
    document.getElementById('verify-totp-input').value = '';
  });

  // ✅ Activar 2FA
  enableTotpBtn.addEventListener('click', async () => {
    const totpCode = document.getElementById('verify-totp-input').value.trim();

    if (!totpCode || totpCode.length !== 6) {
      alert('Ingresa un código válido de 6 dígitos');
      return;
    }

    try {
      // ✅ CAMBIO: Usar SERVER_URL
      const response = await fetch(`${SERVER_URL}/api/enable-totp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ totpCode, secret: currentSecret })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✓ Autenticación 2FA activada correctamente');
        totpModal.style.display = 'none';
        setup2faBtn.innerHTML = '<i class="fas fa-lock"></i> <i class="fas fa-check" style="color: #4ade80;"></i>';
      } else {
        alert(data.error || 'Código inválido');
      }
    } catch (error) {
      alert('Error al activar 2FA');
      console.error(error);
    }
  });

  // ✅ Desactivar 2FA
  disableTotpBtn.addEventListener('click', async () => {
    const totpCode = document.getElementById('verify-totp-input').value.trim();

    if (!totpCode || totpCode.length !== 6) {
      alert('Ingresa tu código actual para desactivar 2FA');
      return;
    }

    if (!confirm('¿Estás seguro de desactivar la autenticación 2FA?')) {
      return;
    }

    try {
      // ✅ CAMBIO: Usar SERVER_URL
      const response = await fetch(`${SERVER_URL}/api/disable-totp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ totpCode })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✓ Autenticación 2FA desactivada');
        totpModal.style.display = 'none';
        setup2faBtn.innerHTML = '<i class="fas fa-lock"></i>';
      } else {
        alert(data.error || 'Código inválido');
      }
    } catch (error) {
      alert('Error al desactivar 2FA');
      console.error(error);
    }
  });
});