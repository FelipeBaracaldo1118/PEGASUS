const crypto = require('crypto');

// Almacenamiento temporal de PINs (usar Redis en producción)
const pinStorage = new Map();

exports.generatePIN = async (req, res) => {
    try {
        const { email, phone } = req.body;
        
        // Verificar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ 
                message: 'Si el usuario existe, recibirá un código' 
            });
        }

        // Generar PIN de 6 dígitos
        const pin = crypto.randomInt(100000, 999999).toString();
        
        // Guardar PIN con expiración de 10 minutos
        pinStorage.set(email, {
            pin: pin,
            expires: Date.now() + 10 * 60 * 1000,
            attempts: 0
        });

        // Enviar PIN por SMS (ejemplo con Twilio)
        await sendSMS(phone, `Tu código de recuperación es: ${pin}`);

        res.json({ message: 'Código enviado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar código' });
    }
};

exports.verifyPIN = async (req, res) => {
    try {
        const { email, pin } = req.body;
        
        const stored = pinStorage.get(email);
        
        if (!stored) {
            return res.status(400).json({ error: 'Código no encontrado' });
        }

        // Verificar expiración
        if (Date.now() > stored.expires) {
            pinStorage.delete(email);
            return res.status(400).json({ error: 'Código expirado' });
        }

        // Verificar intentos
        if (stored.attempts >= 3) {
            pinStorage.delete(email);
            return res.status(400).json({ error: 'Demasiados intentos' });
        }

        // Verificar PIN
        if (stored.pin !== pin) {
            stored.attempts++;
            return res.status(400).json({ error: 'Código incorrecto' });
        }

        // PIN correcto - generar token temporal
        const resetToken = jwt.sign(
            { email, verified: true },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        pinStorage.delete(email);

        res.json({ token: resetToken });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar código' });
    }
};