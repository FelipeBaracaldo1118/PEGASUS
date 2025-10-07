const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Para permitir solicitudes desde el frontend

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/loginDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Esquema de usuario para MongoDB
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Modelo de usuario
const User = mongoose.model('User', userSchema);

// Ruta para registro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Encriptar la contraseña usando bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en MongoDB
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error });
  }
});

// Ruta para login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar un token de autenticación usando JWT
    const token = jwt.sign({ id: user._id }, 'SECRETO', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login exitoso', token });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error });
  }
});

// Ruta protegida (ejemplo)
app.get('/protected', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No se proporcionó token' });
  }

  try {
    const verified = jwt.verify(token, 'SECRETO');
    res.status(200).json({ message: 'Ruta protegida', userId: verified.id });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});