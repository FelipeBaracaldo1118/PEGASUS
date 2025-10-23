const express = require("express");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
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
  Epam_user: { type: String, required: true, unique: true },
  Accounts: { type: [String], default: [] },
  Devices: [{ name: String, priority: Number }],
  availability: { type: String },
  Mmr: { type: Number },
  Password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  userType: { type: String, enum: ['tester', 'keytester'], default: 'tester' }, // <--- NUEVO
  Date_Time: { type: Date, default: Date.now },
  Pod: { type: String },
  Region: { type: String },
  Station: { type: String },
  IsPlaying: { type: Boolean, default: false }
});
const User = mongoose.model("User", userSchema);

//------------------------------------
//esquema playtest
//------------------------------------
const sessionSchema = new mongoose.Schema({
  commsLead: String,
  commsAssist: String,
  backendName: String,
  buildString: String,
  googleDrive: String,
  gameModes: String,
  idOverride: String,
  startTime: String,
  premadeTeams: String,
  teamSize: String,
  testPlan: String,
  totalPlayers: Number,
  captureRequirements: { type: Object, default: {} },
  assignedTesters: [
    {
      testerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      Epam_user: String,
      device: String,
      region: String,
      mmr: Number,
      pod: String,
      station: String,
      dispositivos: [String] // o [{ name: String, priority: Number }]
      // Puedes agregar más campos si lo necesitas
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pod: String,
  createdAt: { type: Date, default: Date.now }
});
const Session = mongoose.model("Session", sessionSchema);

// --------------------------
// RUTA: REGISTRO DE USUARIO
// --------------------------
app.post("/register", async (req, res) => {
  const {
    Epam_user,
    Accounts = [],
    Devices = [],

    availability = "",
    Mmr = 0,
    Password,
    isAdmin = false,
    userType = "tester", // <--- IMPORTANTE
    Pod = "",
    Region = "",
    Station = "",
    IsPlaying = false
  } = req.body;


  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      Epam_user,
      Accounts,
      Devices,
      availability,
      Mmr,
      Password: hashedPassword,
      isAdmin,
      userType, // <--- IMPORTANTE
      Pod,
      Region,
      Station,
      IsPlaying
    });
    await newUser.save();

    res.status(201).json({ success: true, message: "Usuario registrado con éxito" });
  } catch (err) {
    if (err.code === 11000) {
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
  const { Epam_user, Password } = req.body;

  try {
    // Buscar el usuario en la base de datos
    const user = await User.findOne({ Epam_user });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Comparar la contraseña encriptada
    const isMatch = await bcrypt.compare(Password, user.Password);
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
// RUTA: GUARDAR JSON
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
// Middleware para verificar el token JWT
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Token requerido" });
  try {
    const decoded = jwt.verify(token, "SECRETO");
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}
// Endpoint para obtener el usuario actual
app.get("/api/user/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-Password -__v");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Error al obtener usuario" });
  }
});
// Testers en el mismo pod
app.get("/api/testers-in-pod", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user || user.userType !== "keytester") return res.status(403).json({ message: "No autorizado" });
  const testers = await User.find({ Pod: user.Pod, userType: "tester" }).select("-Password -__v");
  res.json(testers);
});

// Todos los testers registrados
app.get("/api/all-testers", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user || user.userType !== "keytester") return res.status(403).json({ message: "No autorizado" });
  const testers = await User.find({ userType: "tester" }).select("-Password -__v");
  res.json(testers);
});

// Crear sesión
app.post("/api/sessions", authMiddleware, async (req, res) => {
  // ...validar que sea keytester...
  const session = new Session({ ...req.body, createdBy: req.userId });
  await session.save();
  res.json(session);
});

// Listar sesiones
app.get("/api/sessions", authMiddleware, async (req, res) => {
  // ...puedes filtrar por pod si quieres...
  const sessions = await Session.find({}).sort({ createdAt: -1 });
  res.json(sessions);
});

// Obtener una sesión
app.get("/api/sessions/:id", authMiddleware, async (req, res) => {
  const session = await Session.findById(req.params.id);
  res.json(session);
});

// Editar sesión
app.put("/api/sessions/:id", authMiddleware, async (req, res) => {
  const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(session);
});

// Borrar sesión
app.delete("/api/sessions/:id", authMiddleware, async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
//--------------------------------
//Asignación automatica de tester
//--------------------------------
app.post("/api/sessions/:id/assign", authMiddleware, async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Sesión no encontrada" });

  // Matriz de compatibilidad actualizada
  const CAPTURA_DISPOSITIVO = {
    CSVProfile: ["PS4", "PS4 Dev", "PS5", "PS5 Dev", "PC", "Android", "iOS", "XSX", "XB1", "Switch", "iPad"],
    LLM: ["PS4 Dev", "PS5 Dev", "PC", "Android", "XSX"],
    LWM: ["PS4 Dev", "PS5 Dev", "XSX"],
    Trace: ["PC", "Android", "iOS"],
    Razor: ["PS4 Dev", "PS5 Dev", "XSX"],
    DX11: ["PC"],
    DX12: ["PC"],
    Performance: ["PC"]
  };

  const captureReq = session.captureRequirements || {};
  const assignedTesters = [];

  // Obtén todos los dispositivos únicos de la tabla
  const dispositivos = new Set();
  for (const distros of Object.values(captureReq)) {
    Object.keys(distros).forEach(d => dispositivos.add(d));
  }

  for (const device of dispositivos) {
    // 1. Junta capturas exclusivas y CSVProfile requeridas para este dispositivo
    let capturasExclusivas = [];
    let csvCount = 0;
    for (const [tipoCaptura, distros] of Object.entries(captureReq)) {
      const cantidad = distros[device] || 0;
      if (!CAPTURA_DISPOSITIVO[tipoCaptura] || !CAPTURA_DISPOSITIVO[tipoCaptura].includes(device)) continue;
      if (tipoCaptura === "CSVProfile") {
        csvCount = cantidad;
      } else {
        for (let i = 0; i < cantidad; i++) capturasExclusivas.push(tipoCaptura);
      }
    }
    // Para Dev, si hay LLM y LWM, agrúpalos juntos
    let agruparLLMLWM = false;
    if ((device.includes("Dev")) && capturasExclusivas.includes("LLM") && capturasExclusivas.includes("LWM")) {
      agruparLLMLWM = true;
    }

    const totalTesters = Math.max(
      agruparLLMLWM ? Math.max(csvCount, 2) : Math.max(capturasExclusivas.length, csvCount),
      1
    );

    // 2. Busca testers disponibles para este dispositivo (prioridad 1 primero, luego secundarios)
    let testers = await User.find({
      Region: "Bogota",
      "Devices.name": device,
      userType: "tester"
    }).sort({ "Devices.priority": 1, Mmr: 1 }).limit(totalTesters);

    // 3. Asigna capturas a testers
    let llmAsignado = false, lwmAsignado = false;
    for (let i = 0; i < testers.length; i++) {
      const tester = testers[i];
      const capturas = [];

      // Siempre asigna CSVProfile si el dispositivo lo permite
      if (csvCount > 0 && CAPTURA_DISPOSITIVO["CSVProfile"].includes(device)) {
        capturas.push("CSVProfile");
        csvCount--;
      }

      // Asigna capturas exclusivas
      if (agruparLLMLWM && !llmAsignado) {
        capturas.push("LLM", "LWM");
        capturasExclusivas = capturasExclusivas.filter(c => c !== "LLM" && c !== "LWM");
        llmAsignado = lwmAsignado = true;
      } else if (capturasExclusivas.length > 0) {
        capturas.push(capturasExclusivas[0]);
        capturasExclusivas.shift();
      }

      // Solo agrega el tester si tiene al menos una captura
      if (capturas.length > 0) {
        assignedTesters.push({
          testerId: tester._id,
          Epam_user: tester.Epam_user,
          device: device,
          region: tester.Region,
          mmr: tester.Mmr,
          pod: tester.Pod,
         
 station: tester.Station,
          dispositivos: [device],
          capturas: capturas
        });
      }
    }
  }

  session.assignedTesters = assignedTesters;
  await session.save();

  res.json({ assignedTesters });
});
// --------------------------
// INICIAR SERVIDOR
// --------------------------
app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor Node corriendo en http://10.13.46.195:3000/");
});