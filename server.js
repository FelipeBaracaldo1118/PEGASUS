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
  idOverrideA: String,
  idOverrideB: String,
  startTime: String,
  premadeTeams: String,
  teamSize: String,
  testPlan: String,
  totalPlayers: Number,
  captureRequirements: { type: Object, default: {} },
  isSprout: { type: Boolean, default: false }, // <-- CAMPO NUEVO en el schema
  assignedTesters: [
    {
      testerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      Epam_user: String,
      device: String,
      region: String,
      mmr: Number,
      pod: String,
      station: String,
      group: String, // solo tendrá valor si es sprout
      dispositivos: [String],
      capturas: [String]
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
    // Buscar el usuario
    const user = await User.findOne({ Epam_user });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    // ✅ Actualizar disponibilidad a "Disponible"
    user.availability = "Disponible";
    await user.save();

    // Generar token
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
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.userType !== "keytester" && !user.isAdmin)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Detectar si es sprout
    const isSprout = !!(req.body.idOverrideA && req.body.idOverrideB);

    // Crear sesión con solo los campos nuevos
    const session = new Session({
      backendName: req.body.backendName,
      buildString: req.body.buildString,
      startTime: req.body.startTime,
      teamSize: req.body.teamSize,
      totalPlayers: req.body.totalPlayers,
      captureRequirements: req.body.captureRequirements,
      createdBy: req.userId,
      isSprout,
      idOverrideA: isSprout ? req.body.idOverrideA : undefined,
      idOverrideB: isSprout ? req.body.idOverrideB : undefined,
      idOverride: !isSprout ? req.body.idOverride : undefined
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Error al crear sesión", error: error.message });
  }
});

// Listar sesiones
app.get("/api/sessions", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let query = {};
    if (user.userType === "keytester") {
      query.createdBy = req.userId;
    }

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'Epam_user');

    res.json(sessions);
  } catch (error) {
    console.error('Error al listar sesiones:', error);
    res.status(500).json({
      message: "Error al obtener las sesiones",
      error: error.message
    });
  }
});

// Obtener una sesión
app.get("/api/sessions/:id", authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .select('-commsLead -commsAssist -googleDrive -gameModes -premadeTeams -testPlan')
      .populate('createdBy', 'Epam_user');

    if (!session) {
      return res.status(404).json({ message: "Sesión no encontrada" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.userType === 'tester' && !user.isAdmin) {
      const isAssigned = session.assignedTesters.some(
        tester => tester.testerId.toString() === req.userId
      );
      if (!isAssigned) {
        return res.status(403).json({ message: "No tienes acceso a esta sesión" });
      }
    }

    res.json(session);
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    res.status(500).json({
      message: "Error al obtener la sesión",
      error: error.message
    });
  }
});

// Editar sesión
app.put("/api/sessions/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.userType !== "keytester" && !user.isAdmin)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Sesión no encontrada" });
    }

    if (!user.isAdmin && session.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "No autorizado para editar esta sesión" });
    }

    // Detectar sprout
    const isSprout = !!(req.body.idOverrideA && req.body.idOverrideB);

    // Solo los campos válidos del formulario nuevo
    const allowedUpdates = {
      backendName: req.body.backendName,
      buildString: req.body.buildString,
      startTime: req.body.startTime,
      teamSize: req.body.teamSize,
      totalPlayers: req.body.totalPlayers,
      captureRequirements: req.body.captureRequirements,
      isSprout,
      idOverrideA: isSprout ? req.body.idOverrideA : undefined,
      idOverrideB: isSprout ? req.body.idOverrideB : undefined,
      idOverride: !isSprout ? req.body.idOverride : undefined
    };

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    res.json(updatedSession);
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    res.status(500).json({
      message: "Error al actualizar la sesión",
      error: error.message
    });
  }
});

// Borrar sesión
app.delete("/api/sessions/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById
      (req.userId);
    if (!user || (user.userType !== "keytester" && !user.isAdmin)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Sesión no encontrada" });
    }

    if (!user.isAdmin && session.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "No autorizado para eliminar esta sesión" });
    }

    await Session.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Sesión eliminada correctamente"
    });
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la sesión",
      error: error.message
    });
  }
});

// Obtener sesiones asignadas a un tester
app.get("/api/user/my-sessions", authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({
      "assignedTesters.testerId": req.userId
    }).sort({ createdAt: -1 });

    const processedSessions = sessions.map(session => {
      const testerAssignment = session.assignedTesters.find(
        tester => tester.testerId.toString() === req.userId
      );

      // Determina el idOverride correcto según el grupo (solo para sprout)
      let idOverride = session.idOverride;
      if (session.isSprout && testerAssignment && testerAssignment.group) {
        idOverride = testerAssignment.group === "A" ? session.idOverrideA : session.idOverrideB;
      }

      return {
        sessionId: session._id,
        backendName: session.backendName,
        buildString: session.buildString,
        gameModes: session.gameModes,
        startTime: session.startTime,
        createdAt: session.createdAt,
        isSprout: session.isSprout || false,
        idOverride: idOverride,
        assignedTesters: session.assignedTesters,
        assignment: {
          device: testerAssignment?.device || null,
          capturas: testerAssignment?.capturas || [],
          pod: testerAssignment?.pod || null,
          station: testerAssignment?.station || null,
          group: testerAssignment?.group || null
        }
      };
    });

    res.json(processedSessions);
  } catch (error) {
    console.error('Error al obtener sesiones del usuario:', error);
    res.status(500).json({
      message: "Error al obtener las sesiones",
      error: error.message
    });
  }
});

// Asignación automática de testers (con lógica sprout)
app.post("/api/sessions/:id/assign", authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Sesión no encontrada" });

    // Recalcular isSprout por seguridad
    const isSprout = session.isSprout || (!!session.idOverrideA && !!session.idOverrideB);

    const assignedTesters = [];
    const testersAsignados = new Set();

    const captureReq = session.captureRequirements || {};
    const dispositivos = new Set();
    for (const distros of Object.values(captureReq)) {
      Object.keys(distros).forEach(d => dispositivos.add(d));
    }

    const CAPTURA_DISPOSITIVO = {
      CSVProfile: ["PS4", "PS4 Dev", "PS5", "PS5 Dev", "PC", "Android", "iOS", "XSX", "XB1", "Switch", "iPad"],
      LLM: ["PS4 Dev", "PS5 Dev", "PC", "Android", "XSX", "Switch"],
      LWM: ["PS4 Dev", "PS5 Dev", "XSX", "Switch"],
      Trace: ["PC", "Android", "iOS", "Switch"],
      Razor: ["PS4 Dev", "PS5 Dev", "XSX"],
      DX11: ["PC"],
      DX12: ["PC"],
      Performance: ["PC"]
    };

    for (const device of dispositivos) {
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

      let agruparLLMLWM = false;
      if ((device.includes("Dev")) && capturasExclusivas.includes("LLM") && capturasExclusivas.includes("LWM")) {
        agruparLLMLWM = true;
      }

      const totalTesters = Math.max(
        agruparLLMLWM ? Math.max(csvCount, 2) : Math.max(capturasExclusivas.length, csvCount),
        1
      );

      let testers = await User.find({
        Region: "Bogota",
        "Devices.name": device,
        userType: "tester",
        Epam_user: { $nin: Array.from(testersAsignados) }
      }).sort({ "Devices.priority": 1, Mmr: 1 }).limit(totalTesters);

      let llmAsignado = false, lwmAsignado = false;
      for (const tester of testers) {
        if (testersAsignados.has(tester.Epam_user)) continue;
        const capturas = [];
        if (csvCount > 0 && CAPTURA_DISPOSITIVO["CSVProfile"].includes(device)) {
          capturas.push("CSVProfile");
          csvCount--;
        }
        if (agruparLLMLWM && !llmAsignado) {
          capturas.push("LLM", "LWM");
          capturasExclusivas = capturasExclusivas.filter(c => c !== "LLM" && c !== "LWM");
          llmAsignado = lwmAsignado = true;
        } else if (capturasExclusivas.length > 0) {
          const captura = capturasExclusivas.shift();
          if (captura) capturas.push(captura);
        }

        if (capturas.length > 0) {
          testersAsignados.add(tester.Epam_user);
          assignedTesters.push({
            testerId: tester._id,
            Epam_user: tester.Epam_user,
            device,
            region: tester.Region,
            mmr: tester.Mmr,
            pod: tester.Pod,
            station: tester.Station,
            dispositivos: [device],
            capturas
          });
        }
      }
    }

    if (isSprout) {
      const half = Math.ceil(assignedTesters.length / 2);
      const groupA = assignedTesters.slice(0, half).map(t => ({ ...t, group: "A" }));
      const groupB = assignedTesters.slice(half).map(t => ({ ...t, group: "B" }));
      session.assignedTesters = [...groupA, ...groupB];
    } else {
      session.assignedTesters = assignedTesters;
      // no asignamos "AL" ni otro valor, queda sin grupo si no es sprout
    }

    await session.save();
    res.json({ assignedTesters: session.assignedTesters });
  } catch (error) {
    console.error('Error en la asignación automática:', error);
    res.status(500).json({ message: "Error en la asignación automática", error: error.message });
  }
});


// Obtener detalles completos de una sesión específica para un tester
app.get("/api/user/sessions/:sessionId", authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      "assignedTesters.testerId": req.userId
    });

    if (!session) {
      return res.status(404).json({ message: "Sesión no encontrada" });
    }

    const testerAssignment = session.assignedTesters.find(
      tester => tester.testerId.toString() === req.userId
    );

    // Determina el idOverride correcto según el grupo (solo para sprout)
    let idOverride = session.idOverride;
    if (session.isSprout && testerAssignment && testerAssignment.group) {
      idOverride = testerAssignment.group === "A" ? session.idOverrideA : session.idOverrideB;
    }

    const sessionDetails = {
      sessionId: session._id,
      commsLead: session.commsLead,
      commsAssist: session.commsAssist,
      backendName: session.backendName,
      buildString: session.buildString,
      googleDrive: session.googleDrive,
      gameModes: session.gameModes,
      idOverride: idOverride,
      startTime: session.startTime,
      premadeTeams: session.premadeTeams,
      teamSize: session.teamSize,
      testPlan: session.testPlan,
      totalPlayers: session.totalPlayers,
      createdAt: session.createdAt,
      assignment: {
        device: testerAssignment.device,
        capturas: testerAssignment.capturas,
        pod: testerAssignment.pod,
        station: testerAssignment.station,
        group: testerAssignment.group || null
      }
    };

    res.json(sessionDetails);
  } catch (error) {
    console.error('Error al obtener detalles de la sesión:', error);
    res.status(500).json({ message: "Error al obtener los detalles de la sesión" });
  }
});
// Obtener perfil de un tester específico (solo keytester y admin)
app.get("/api/user/:id", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser || (currentUser.userType !== "keytester" && !currentUser.isAdmin)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const tester = await User.findById(req.params.id).select("-Password -__v");
    if (!tester) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(tester);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
});

// Modificar el endpoint existente de /api/user/me para incluir el conteo de sesiones
app.get("/api/user/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-Password -__v");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const sessionCount = await Session.countDocuments({
      "assignedTesters.testerId": req.userId
    });

    const userWithSessionCount = {
      ...user.toObject(),
      totalSessions: sessionCount
    };

    res.json(userWithSessionCount);
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
});

//peticion para saber si tiene que volver a iniciar sesion
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

//logout 
app.post("/logout", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Cambiar disponibilidad a N/A
    user.availability = "N/A";
    await user.save();

    res.json({ success: true, message: "Sesión cerrada y disponibilidad actualizada" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al cerrar sesión" });
  }
});
// --------------------------
// INICIAR SERVIDOR
// --------------------------
app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor Node corriendo en http://10.13.46.195:3000/");
});