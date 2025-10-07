const express = require("express");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas
const jwt = require("jsonwebtoken"); // Para generar tokens

const app = express();
app.use(cors()); // Permitir llamadas desde el frontend
app.use(express.json());

// --------------------------
// CONEXIÓN A MONGODB
// --------------------------
mongoose.connect("mongodb://localhost:27017/loginApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("🚀 Conexión exitosa a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// --------------------------
// ESQUEMA Y MODELO DE USUARIO
// --------------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// --------------------------
// RUTA: REGISTRO DE USUARIO
// --------------------------
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Usuario registrado con éxito" });
  } catch (err) {
    if (err.code === 11000) {
      // Error porque el usuario ya existe
      res.status(400).json({ success: false, message: "El usuario ya existe" });
    } else {
      res.status(500).json({ success: false, message: "Error al registrar usuario" });
    }
  }
});

// --------------------------
// RUTA: LOGIN DE USUARIO
// --------------------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en la base de datos
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Comparar la contraseña encriptada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    // Generar un token JWT
    const token = jwt.sign({ userId: user._id }, "SECRETO", { expiresIn: "1h" });

    res.status(200).json({ success: true, message: "Login exitoso", token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  }
});

// --------------------------
// RUTA: GUARDAR JSON (YA EXISTE EN TU SERVIDOR)
// --------------------------
app.post("/save-json", (req, res) => {
  const data = req.body;
  const fileContent =
    "const buildsData = " + JSON.stringify(data, null, 2) + ";\n";

  fs.writeFile("./js/serverurl.js", fileContent, (err) => {
    if (err) {
      console.error("❌ Error al guardar:", err);
      return res.status(500).json({ success: false, message: "Error al guardar" });
    }
    console.log("✔ serverurl.js actualizado");
    res.json({ success: true, message: "Archivo actualizado" });
  });
});

// --------------------------
// RUTA PROTEGIDA (EJEMPLO)
// --------------------------
app.get("/protected", (req, res) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ success: false, message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, "SECRETO");
    res.status(200).json({ success: true, message: "Bienvenido a la ruta protegida", userId: decoded.userId });
  } catch (err) {
    res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
});

// --------------------------
// INICIAR SERVIDOR
// --------------------------
app.listen(3000, "0.0.0.0",() => {
  console.log("Servidor Node corriendo en http://10.13.46.195:3000/");
});