const express = require("express");
const { Server } = require("socket.io");
const http = require("http");  // Usamos http.Server para crear el servidor
const axios = require('axios');  // Asegúrate de importar axios

// Crear la aplicación Express
const app = express();

// Crear el servidor HTTP
const server = http.createServer(app);

// Configuración de Socket.io
const io = new Server(app, {
  cors: {
    origin: "https://pruebaimpresion.vercel.app/", // Cambia esto a tu dominio
    methods: ["GET", "POST"],
  },
});


// Middleware
app.use(express.json());  // Analizar los datos JSON entrantes
app.use(express.static("public"));  // Servir archivos estáticos desde la carpeta public

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
    axios.post('http://localhost:3001/procesar-comanda', comandaData)
      .then(response => {
        console.log('Comanda procesada:', response.data);
      })
      .catch(error => {
        console.error('Error al procesar la comanda:', error);
      });

    // Reenviar la comanda a los receptores
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

// Iniciar el servidor HTTP en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

// Exportamos el servidor HTTP para que Vercel lo maneje
module.exports = server;
