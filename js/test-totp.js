const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
const PORT = 4000;

// Almacén temporal en memoria (solo para pruebas)
let currentSecret = null;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prueba 2FA</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #1a1a1a;
          color: white;
        }
        .container {
          background: #2a2a2a;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px 5px;
        }
        button:hover {
          opacity: 0.9;
        }
        #qrCode {
          text-align: center;
          margin: 20px 0;
        }
        #qrCode img {
          border: 4px solid white;
          border-radius: 10px;
          padding: 10px;
          background: white;
        }
        .secret {
          background: #333;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          word-break: break-all;
          font-family: monospace;
          color: #4ade80;
          letter-spacing: 2px;
        }
        input {
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: 2px solid #667eea;
          width: 150px;
          text-align: center;
          letter-spacing: 5px;
          font-size: 20px;
        }
        .result {
          margin-top: 15px;
          padding: 15px;
          border-radius: 5px;
          font-weight: bold;
        }
        .success {
          background: #10b981;
          color: white;
        }
        .error {
          background: #ef4444;
          color: white;
        }
        .info {
          background: #3b82f6;
          color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 Prueba de Autenticación 2FA</h1>
        
        <div class="info">
          <strong>📱 Instrucciones:</strong><br>
          1. Haz clic en "Generar Código QR"<br>
          2. Escanea el QR con Google Authenticator o Microsoft Authenticator<br>
          3. Ingresa el código de 6 dígitos que aparece en tu app<br>
          4. Haz clic en "Verificar Código"
        </div>

        <button onclick="generateQR()">🔄 Generar Código QR</button>
        
        <div id="qrCode"></div>
        <div id="secretDisplay"></div>
        
        <div id="verifySection" style="display:none;">
          <h3>Verificar Código TOTP</h3>
          <input type="text" id="totpInput" placeholder="000000" maxlength="6" pattern="[0-9]*">
          <button onclick="verifyCode()">✅ Verificar Código</button>
          <div id="result"></div>
        </div>
        
        <div id="autoCode" style="margin-top: 20px;"></div>
      </div>

      <script>
        let currentSecret = '';

        async function generateQR() {
          const response = await fetch('/generate-qr');
          const data = await response.json();
          
          currentSecret = data.secret;
          
          document.getElementById('qrCode').innerHTML = 
            '<h3>Escanea este código QR:</h3><img src="' + data.qrCode + '" width="250">';
          
          document.getElementById('secretDisplay').innerHTML = 
            '<h3>O ingresa manualmente este código:</h3><div class="secret">' + data.secret + '</div>';
          
          document.getElementById('verifySection').style.display = 'block';
          document.getElementById('result').innerHTML = '';
          
          // Mostrar código actual (solo para debug)
          showCurrentCode();
          setInterval(showCurrentCode, 1000);
        }

        async function showCurrentCode() {
          const response = await fetch('/current-code');
          const data = await response.json();
          
          document.getElementById('autoCode').innerHTML = 
            '<div class="info"><strong>🔢 Código actual (para pruebas):</strong> <span style="font-size: 24px; letter-spacing: 3px;">' + 
            data.code + '</span><br><small>Tiempo restante: ' + data.remaining + 's</small></div>';
        }

        async function verifyCode() {
          const code = document.getElementById('totpInput').value;
          
          if (code.length !== 6) {
            document.getElementById('result').innerHTML = 
              '<div class="result error">⚠️ Ingresa un código de 6 dígitos</div>';
            return;
          }

          const response = await fetch('/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
          });
          
          const data = await response.json();
          
          if (data.verified) {
            document.getElementById('result').innerHTML = 
              '<div class="result success">✅ ¡Código verificado correctamente!</div>';
          } else {
            document.getElementById('result').innerHTML = 
              '<div class="result error">❌ Código inválido. Intenta de nuevo.</div>';
          }
        }

        // Auto-focus en el input
        document.getElementById('totpInput')?.addEventListener('input', function(e) {
          this.value = this.value.replace(/[^0-9]/g, '');
        });
      </script>
    </body>
    </html>
  `);
});

// Generar QR
app.get('/generate-qr', async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: 'Pegasus (EPAM-TestUser)',
    issuer: 'Pegasus FNPT'
  });

  currentSecret = secret.base32;

  const otpauthUrl = speakeasy.otpauthURL({
    secret: currentSecret,
    label: 'EPAM-TestUser',
    issuer: 'Pegasus FNPT',
    encoding: 'base32'
  });

  const qrCode = await QRCode.toDataURL(otpauthUrl);

  res.json({
    secret: currentSecret,
    qrCode: qrCode
  });
});

// Obtener código actual (solo para debug)
app.get('/current-code', (req, res) => {
  if (!currentSecret) {
    return res.json({ code: '------', remaining: 0 });
  }

  const token = speakeasy.totp({
    secret: currentSecret,
    encoding: 'base32'
  });

  // Calcular tiempo restante
  const remaining = 30 - Math.floor((Date.now() / 1000) % 30);

  res.json({
    code: token,
    remaining: remaining
  });
});

// Verificar código
app.post('/verify', express.json(), (req, res) => {
  const { code } = req.body;

  if (!currentSecret) {
    return res.json({ verified: false, error: 'No se ha generado un secret' });
  }

  const verified = speakeasy.totp.verify({
    secret: currentSecret,
    encoding: 'base32',
    token: code,
    window: 2
  });

  console.log(`🔍 Verificando código: ${code} - Resultado: ${verified ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);

  res.json({ verified: verified });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔐  SERVIDOR DE PRUEBA 2FA INICIADO                  ║
║                                                           ║
║     📡  URL: http://localhost:${PORT}                        ║
║                                                           ║
║     📱  Abre la URL en tu navegador                      ║
║     📷  Escanea el QR con tu autenticador                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});