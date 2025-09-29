const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const axios = require("axios"); // Usar axios para hacer peticiones HTTP

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Socket.IO
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

// Endpoint que simula el procesamiento de la comanda en el servidor local (ej: nginx)
app.post("/procesar-comanda", (req, res) => {
  const { from, products } = req.body;
  console.log(`Procesando comanda desde ${from}:`, products);

  // Aquí, la comanda ya ha sido procesada, se podría hacer algo más como imprimir o guardar en una base de datos
  res.send({
    message: "Comanda procesada correctamente en el servidor local.",
    from,
    products,
  });
});

// Iniciar servidor
server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
