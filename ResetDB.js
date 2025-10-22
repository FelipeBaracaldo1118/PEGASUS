const mongoose = require("mongoose");
const User = require("./models/User"); // Asegúrate de que el path es correcto

mongoose.connect("mongodb://localhost:27017/loginApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

User.updateMany({}, { $unset: { Id_User: "" } })
  .then(() => {
    console.log("Campo Id_User eliminado de todos los usuarios");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("Error eliminando Id_User:", err);
    mongoose.disconnect();
  });