const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

// ================== MIDDLEWARE ==================
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

// ================== CONEXIÓN A MONGODB ==================
mongoose
  .connect("mongodb://localhost:27017/loginDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// ================== ESQUEMA Y MODELO ==================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

// ================== RUTAS API ==================

// Registro
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar usuario", error });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, "SECRETO", { expiresIn: "1h" });

    res.status(200).json({ message: "Login exitoso", token });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión", error });
  }
});

// Ruta protegida de ejemplo
app.get("/protected", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(403).json({ message: "No se proporcionó token" });

  try {
    const verified = jwt.verify(token, "SECRETO");
    res.status(200).json({ message: "Ruta protegida", userId: verified.id });
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
});

// ================== RUTA PARA FRONTEND ==================
// Si el usuario recarga cualquier ruta (ej: /pages/profile.html),
// Express devolverá automáticamente index.html o la página que exista en tu carpeta.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Manejo global del 404 (solo si el archivo no existe)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "index.html"));
});

// ================== INICIO DEL SERVIDOR ==================
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
