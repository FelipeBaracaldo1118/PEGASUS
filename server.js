const express = require("express");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const { swaggerUi, specs } = require('./swagger');

// Al inicio de tu archivo principal de Node.js (por ejemplo, server.js)
//const { spawn } = require('child_process');
const app = express();
app.use(cors());
app.use(express.json());
// Servir todos los archivos estáticos (HTML, CSS, JS, imágenes, etc.)
app.use(express.static(path.join(__dirname)));

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs));
// ============ SWAGGER UI ============

// Endpoint para obtener el JSON de Swagger
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});
// --------------------------
// CONEXIÓN A MONGODB
// --------------------------
mongoose.connect("mongodb://localhost:27017/loginApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("🚀 Conexión exitosa a MongoDB");
    console.log("📚 Documentación Swagger disponible en: http://localhost:3000/api-docs");
  })
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
  userType: { type: String, enum: ['tester', 'keytester'], default: 'tester' },
  Date_Time: { type: Date, default: Date.now },
  Pod: { type: String },
  Region: { type: String },
  Station: { type: String },
  IsPlaying: { type: Boolean, default: false },
  StateOfInstalling: { type: String, enum: ['instalando', 'no instalado', 'instalado'], default: 'no instalado' } // <--- NUEVO CAMPO
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
  isSprout: { type: Boolean, default: false },
  sessionType: {
    type: String,
    enum: ['normal', 'sprout', 'juno', 'sparks'],
    default: 'normal'
  },
  assignedTesters: [
    {
      testerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      Epam_user: String,
      device: String,
      region: String,
      mmr: Number,
      pod: String,
      station: String,
      group: String,
      team: String,
      dispositivos: [String],
      capturas: [String]
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pod: String,
  createdAt: { type: Date, default: Date.now }
});
const Session = mongoose.model("Session", sessionSchema);
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Epam_user
 *               - Password
 *             properties:
 *               Epam_user:
 *                 type: string
 *                 example: EPAM-NewUser
 *               Accounts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['account1', 'account2']
 *               Devices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: PC
 *                     priority:
 *                       type: number
 *                       example: 1
 *               availability:
 *                 type: string
 *                 example: Disponible
 *               Mmr:
 *                 type: number
 *                 example: 1500
 *               Password:
 *                 type: string
 *                 example: password123
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *               userType:
 *                 type: string
 *                 enum: [tester, keytester]
 *                 example: tester
 *               Pod:
 *                 type: string
 *                 example: POD-A
 *               Region:
 *                 type: string
 *                 example: Bogota
 *               Station:
 *                 type: string
 *                 example: Station-01
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario registrado con éxito
 *       400:
 *         description: El usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 */
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
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Epam_user
 *               - Password
 *             properties:
 *               Epam_user:
 *                 type: string
 *                 example: EPAM-HaruyoshieE
 *               Password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login exitoso
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: Contraseña incorrecta
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
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
/**
 * @swagger
 * /save-json:
 *   post:
 *     summary: Guardar configuración en archivo JSON
 *     tags: [Utilidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Archivo actualizado
 *       500:
 *         description: Error al guardar
 */
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
/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Verificar validez del token
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido o expirado
 *       403:
 *         description: Token no proporcionado
 */
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
// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.headers["authorization"];

    console.log("Token recibido:", token); // Para debugging

    if (!token) {
      return res.status(401).json({ message: "No se proporcionó token" });
    }

    // Verificar el token
    const decoded = jwt.verify(token, "SECRETO");

    console.log("Token decodificado:", decoded); // Para debugging

    // Asignar el userId al request
    req.userId = decoded.userId;

    console.log("Usuario ID:", req.userId); // Para debugging

    next();
  } catch (error) {
    console.error("Error en autenticación:", error);
    return res.status(403).json({
      message: "Token inválido o expirado",
      error: error.message
    });
  }
};
/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     totalSessions:
 *                       type: number
 *                       example: 5
 *       404:
 *         description: Usuario no encontrado
 */
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
/**
 * @swagger
 * /api/testers-in-pod:
 *   get:
 *     summary: Obtener testers en el mismo POD
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de testers en el POD
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: No autorizado (solo keytester)
 */
// Testers en el mismo pod
app.get("/api/testers-in-pod", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user || user.userType !== "keytester") return res.status(403).json({ message: "No autorizado" });
  const testers = await User.find({ Pod: user.Pod, userType: "tester" }).select("-Password -__v");
  res.json(testers);
});
/**
 * @swagger
 * /api/all-testers:
 *   get:
 *     summary: Obtener todos los testers registrados
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los testers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: No autorizado (solo keytester)
 */
// Todos los testers registrados
app.get("/api/all-testers", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user || user.userType !== "keytester") return res.status(403).json({ message: "No autorizado" });
  const testers = await User.find({ userType: "tester" }).select("-Password -__v");
  res.json(testers);
});
/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Crear nueva sesión de testing
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backendName
 *               - buildString
 *               - startTime
 *             properties:
 *               commsLead:
 *                 type: string
 *                 example: John Doe
 *               commsAssist:
 *                 type: string
 *                 example: Jane Smith
 *               backendName:
 *                 type: string
 *                 example: baseball
 *               buildString:
 *                 type: string
 *                 example: ++Fortnite+Release-38.10-CL-47160256
 *               googleDrive:
 *                 type: string
 *                 example: https://drive.google.com/...
 *               gameModes:
 *                 type: string
 *                 example: Battle Royale
 *               idOverride:
 *                 type: string
 *                 example: '42069'
 *               idOverrideA:
 *                 type: string
 *                 example: '42070'
 *               idOverrideB:
 *                 type: string
 *                 example: '42071'
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T13:00:00Z
 *               premadeTeams:
 *                 type: string
 *                 example: 'Yes'
 *               teamSize:
 *                 type: string
 *                 example: '4'
 *               testPlan:
 *                 type: string
 *                 example: Test Plan Document
 *               totalPlayers:
 *                 type: number
 *                 example: 20
 *               captureRequirements:
 *                 type: object
 *                 example: { CSVProfile: { PC: 2, PS5: 1 }, LLM: { PS5: 1 } }
 *               sessionType:
 *                 type: string
 *                 enum: [normal, sprout, juno, sparks]
 *                 example: normal
 *               pod:
 *                 type: string
 *                 example: POD-A
 *     responses:
 *       201:
 *         description: Sesión creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sesión creada exitosamente
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *       403:
 *         description: No autorizado (solo keytester y admin)
 */
// Crear nueva sesión
app.post("/api/sessions", authMiddleware, async (req, res) => {
  try {
    // Verificar autorización
    const user = await User.findById(req.userId);
    if (!user || (user.userType !== "keytester" && !user.isAdmin)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const {
      commsLead,
      commsAssist,
      backendName,
      buildString,
      googleDrive,
      gameModes,
      idOverride,
      idOverrideA,
      idOverrideB,
      startTime,
      premadeTeams,
      teamSize,
      testPlan,
      totalPlayers,
      captureRequirements,
      sessionType,
      pod
    } = req.body;

    // Crear nueva sesión
    const newSession = new Session({
      commsLead,
      commsAssist,
      backendName,
      buildString,
      googleDrive,
      gameModes,
      idOverride,
      idOverrideA,
      idOverrideB,
      startTime,
      premadeTeams,
      teamSize,
      testPlan,
      totalPlayers: parseInt(totalPlayers) || 0,
      captureRequirements,
      sessionType: sessionType || 'normal',
      createdBy: req.userId,
      pod
    });

    // Guardar la sesión
    const savedSession = await newSession.save();

    // Enviar respuesta
    res.status(201).json({
      success: true,
      message: "Sesión creada exitosamente",
      session: savedSession
    });

  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear sesión",
      error: error.message
    });
  }
});
/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Listar todas las sesiones
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 */
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

// 🔹 ENDPOINT: Obtener sesiones creadas por el KeyTester actual
app.get("/api/user/my-sessions", authMiddleware, async (req, res) => {
  try {
    console.log("Buscando sesiones para usuario:", req.userId);

    // Verificar que el usuario existe
    const user = await User.findById(req.userId);
    if (!user) {
      console.log("Usuario no encontrado");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("Usuario encontrado:", user.Epam_user);

    // Buscar sesiones
    const sessions = await Session.find({
      "assignedTesters.testerId": req.userId
    }).sort({ createdAt: -1 });

    console.log(`Encontradas ${sessions.length} sesiones`);

    const processedSessions = sessions.map(session => {
      const testerAssignment = session.assignedTesters.find(
        tester => tester.testerId && tester.testerId.toString() === req.userId
      );

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
        endTime: session.endTime,
        createdAt: session.createdAt,
        sessionType: session.sessionType || 'normal',
        isSprout: session.isSprout || false,
        idOverride: idOverride,
        pod: session.pod,
        totalPlayers: session.totalPlayers,
        // ✅ CORRECCIÓN: Incluir todos los testers asignados
        assignedTesters: session.assignedTesters,
        // ✅ CORRECCIÓN: Datos específicos de MI asignación
        assignment: {
          device: testerAssignment?.device || null,
          capturas: testerAssignment?.capturas || [],
          dispositivos: testerAssignment?.dispositivos || [],
          pod: testerAssignment?.pod || null,
          station: testerAssignment?.station || null,
          group: testerAssignment?.group || null,
          team: testerAssignment?.team || null,
          region: testerAssignment?.region || null,
          mmr: testerAssignment?.mmr || null
        }
      };
    });

    res.json(processedSessions);

  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({
      message: "Error al obtener las sesiones",
      error: error.message
    });
  }
});
/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Obtener detalles de una sesión específica
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     responses:
 *       200:
 *         description: Detalles de la sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: Sesión no encontrada
 *       403:
 *         description: No tienes acceso a esta sesión
 */
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
/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Actualizar una sesión existente
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Session'
 *     responses:
 *       200:
 *         description: Sesión actualizada
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Sesión no encontrada
 */
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
/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Eliminar una sesión
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     responses:
 *       200:
 *         description: Sesión eliminada correctamente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Sesión no encontrada
 */
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
/**
 * @swagger
 * /api/user/my-sessions:
 *   get:
 *     summary: Obtener sesiones asignadas al usuario actual
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones asignadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                   backendName:
 *                     type: string
 *                   buildString:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                   sessionType:
 *                     type: string
 *                   assignment:
 *                     $ref: '#/components/schemas/Assignment'
 */
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
/**
 * @swagger
 * /api/sessions/{id}/assign:
 *   post:
 *     summary: Asignación automática de testers a una sesión
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     description: |
 *       Asigna automáticamente testers según los requerimientos de captura y dispositivos.
 *       Soporta diferentes tipos de sesión: normal, sprout, juno, sparks.
 *     responses:
 *       200:
 *         description: Testers asignados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignedTesters:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Sesión no encontrada
 *       500:
 *         description: Error en la asignación automática
 */
// Asignación automática de testers (con soporte para Sprout, Juno, Sparks)
app.post("/api/sessions/:id/assign", authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Sesión no encontrada" });

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

    // Repartición de testers según requerimientos
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
            device,  // ✅ Dispositivo principal
            region: tester.Region,
            mmr: tester.Mmr,
            pod: tester.Pod,
            station: tester.Station,
            dispositivos: [device],  // ✅ Array de dispositivos
            capturas  // ✅ Array de capturas asignadas
          });
        }
      }
    }

    // Aplicar lógica según tipo de sesión
    const { sessionType } = session;

    if (sessionType === "sprout") {
      const half = Math.ceil(assignedTesters.length / 2);
      const groupA = assignedTesters.slice(0, half).map(t => ({ ...t, group: "A" }));
      const groupB = assignedTesters.slice(half).map(t => ({ ...t, group: "B" }));
      session.assignedTesters = [...groupA, ...groupB];

    } else if (sessionType === "juno") {
      const teamSize = 4;
      const totalTeams = 10;
      const totalNeeded = totalTeams * teamSize;
      const selected = assignedTesters.slice(0, totalNeeded);

      const teams = [];
      for (let i = 0; i < totalTeams; i++) {
        const buildGroup = i < 5 ? "A" : "B";
        const members = selected.slice(i * teamSize, (i + 1) * teamSize).map(t => ({
          ...t,
          group: buildGroup,
          team: `Team ${i + 1}`
        }));
        teams.push(...members);
      }
      session.assignedTesters = teams;

    } else if (sessionType === "sparks") {
      const teamSize = 4;
      const totalTeams = 5;
      const selected = assignedTesters.slice(0, totalTeams * teamSize);

      const teams = [];
      for (let i = 0; i < totalTeams; i++) {
        const buildGroup = i < Math.ceil(totalTeams / 2) ? "A" : "B";
        const members = selected.slice(i * teamSize, (i + 1) * teamSize).map(t => ({
          ...t,
          group: buildGroup,
          team: `Team ${i + 1}`
        }));
        teams.push(...members);
      }
      session.assignedTesters = teams;

    } else {
      session.assignedTesters = assignedTesters;
    }

    await session.save();
    res.json({ assignedTesters: session.assignedTesters });
  } catch (error) {
    console.error('Error en la asignación automática:', error);
    res.status(500).json({ message: "Error en la asignación automática", error: error.message });
  }
});

/**
 * @swagger
 * /api/user/sessions/{sessionId}:
 *   get:
 *     summary: Obtener detalles completos de una sesión asignada
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     responses:
 *       200:
 *         description: Detalles completos de la sesión
 *       404:
 *         description: Sesión no encontrada
 */

// Obtener detalles completos de una sesión específica para un tester
app.get("/api/user/sessions/:sessionId", authMiddleware, async (req, res) => {
  try {
    console.log('Buscando sesión:', req.params.sessionId);
    console.log('Usuario:', req.userId);

    const session = await Session.findOne({
      _id: req.params.sessionId,
      "assignedTesters.testerId": req.userId
    });

    if (!session) {
      return res.status(404).json({ message: "Sesión no encontrada" });
    }

    const testerAssignment = session.assignedTesters.find(
      tester => tester.testerId && tester.testerId.toString() === req.userId
    );

    // Determina el idOverride correcto según el grupo
    let idOverride = session.idOverride;
    if (session.sessionType === "sprout" && testerAssignment.group) {
      idOverride = testerAssignment.group === "A" ? session.idOverrideA : session.idOverrideB;
    } else if (session.sessionType === "juno" && testerAssignment.group) {
      idOverride = testerAssignment.group === "A" ? session.idOverrideA : session.idOverrideB;
    } else if (session.sessionType === "sparks" && testerAssignment.group) {
      idOverride = testerAssignment.group === "A" ? session.idOverrideA : session.idOverrideB;
    }

    const sessionDetails = {
      sessionId: session._id,
      backendName: session.backendName,
      buildString: session.buildString,
      gameModes: session.gameModes,
      idOverride: idOverride,
      startTime: session.startTime,
      endTime: session.endTime,
      premadeTeams: session.premadeTeams,
      teamSize: session.teamSize,
      testPlan: session.testPlan,
      totalPlayers: session.totalPlayers,
      createdAt: session.createdAt,
      sessionType: session.sessionType || 'normal',
      isSprout: session.isSprout || false,
      pod: session.pod,
      captureRequirements: session.captureRequirements,
      // ✅ CORRECCIÓN: Incluir TODOS los datos de la asignación
      assignment: {
        device: testerAssignment.device || null,
        capturas: testerAssignment.capturas || [],
        dispositivos: testerAssignment.dispositivos || [],
        pod: testerAssignment.pod || null,
        station: testerAssignment.station || null,
        group: testerAssignment.group || null,
        team: testerAssignment.team || null,
        region: testerAssignment.region || null,
        mmr: testerAssignment.mmr || null,
        Epam_user: testerAssignment.Epam_user || null
      }
    };

    console.log('Enviando detalles de sesión:', sessionDetails);
    res.json(sessionDetails);

  } catch (error) {
    console.error('Error al obtener detalles de la sesión:', error);
    res.status(500).json({
      message: "Error al obtener los detalles de la sesión",
      error: error.message
    });
  }
});
/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Obtener perfil de un tester específico
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: No autorizado (solo keytester y admin)
 *       404:
 *         description: Usuario no encontrado
 */
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
/**
 * @swagger
 * /actualizar-estado:
 *   post:
 *     summary: Actualizar estado de instalación de un usuario
 *     tags: [Utilidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - station
 *               - nuevoEstado
 *             properties:
 *               station:
 *                 type: string
 *                 example: Station-01
 *               nuevoEstado:
 *                 type: string
 *                 enum: [instalando, no instalado, instalado]
 *                 example: instalado
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       404:
 *         description: Usuario no encontrado
 */
// Endpoint para actualizar estado
app.post('/actualizar-estado', async (req, res) => {
  const { station, nuevoEstado } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { Station: station },
      { StateOfInstalling: nuevoEstado },
      { new: true }
    );
    if (!user) {
      return res.status(404).send('Usuario no encontrado por Station');
    }
    res.status(200).send(`Estado actualizado para Station: ${user.Station}`);
  } catch (error) {
    res.status(500).send('Error al actualizar el estado');
  }
});
/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Buscar usuarios por nombre o estación
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda (nombre o estación)
 *         example: EPAM
 *       - in: query
 *         name: pod
 *         schema:
 *           type: string
 *         description: Filtrar por POD
 *         example: POD-A
 *     responses:
 *       200:
 *         description: Lista de usuarios encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
// Endpoint: Buscar usuarios por nombre y pod
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q || '';
    const pod = req.query.pod;

    // Búsqueda por Epam_user o Station (ambos insensibles a mayúsculas/minúsculas)
    const search = {
      $or: [
        { Epam_user: { $regex: query, $options: 'i' } },
        { Station: { $regex: query, $options: 'i' } }
      ]
    };
    if (pod) search.Pod = pod;

    const users = await User.find(search)
      .select('Epam_user Pod Station Region Devices userType IsPlaying availability');

    res.json(users);
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ message: 'Error al buscar usuarios', error: error.message });
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
/*const pythonProcess = spawn('python', ['C:\\filesServer\\python\\actualizar_estado.py'], {
  stdio: 'inherit' // Esto muestra la salida del script Python en la consola de Node.js
});*/
// --------------------------
// INICIAR SERVIDOR
// --------------------------
app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor Node corriendo en http://10.13.46.195:8080/");
});