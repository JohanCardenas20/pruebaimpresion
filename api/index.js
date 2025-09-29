const express = require("express");
const { Server } = require("socket.io");
const axios = require("axios"); // Usar axios para hacer peticiones HTTP
const cors = require('cors');

// Crear la aplicación Express
const app = express();

// Configuración de CORS para Socket.io
app.use(cors({
  origin: '*', // O puedes colocar el dominio específico de tu frontend
  methods: ['GET', 'POST'],
}));

// Middleware
app.use(express.json()); // Analizar los datos JSON entrantes
app.use(express.static("public")); // Servir archivos estáticos desde la carpeta public

// Inicializar el servidor de Socket.io
const io = new Server(app, {
  cors: {
    origin: '*', // Asegúrate de permitir las conexiones desde tu frontend
  }
});

// Manejo de las conexiones de Socket.io
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("setRole", (role) => {
    socket.role = role;
    console.log(`Cliente ${socket.id} es ${role}`);
  });

  // Emisor envía una comanda
  socket.on("sendOrder", (products) => {
    console.log(`Comanda recibida de ${socket.id}:`, products);

    // Preparar los datos para la solicitud al servidor local
    const comandaData = {
      from: socket.id,
      products: products,
    };

    // Usar axios para enviar la comanda al servidor local
    axios.post('https://my-backend-app.vercel.app/procesar-comanda', comandaData)
      .then(response => {
        console.log('Comanda procesada:', response.data);
      })
      .catch(error => {
        console.error('Error al procesar la comanda:', error);
      });

    // Reenviar a todos los receptores
    io.sockets.sockets.forEach((s) => {
      if (s.role === "receptor") {
        s.emit("receiveOrder", comandaData);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Endpoint que simula el procesamiento de la comanda en el servidor local
app.post("/procesar-comanda", (req, res) => {
  const { from, products } = req.body;
  console.log(`Procesando comanda desde ${from}:`, products);

  // Aquí puedes agregar la lógica para guardar en una base de datos, imprimir o cualquier otra acción
  res.send({
    message: "Comanda procesada correctamente en el servidor local.",
    from,
    products,
  });
});

// Exportamos la aplicación Express para que Vercel la maneje como una función serverless
module.exports = app;
