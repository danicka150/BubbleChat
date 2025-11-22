const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Раздаём фронтенд
app.use(express.static(path.join(__dirname, "public")));

// Сопоставление ник → socket.id
const users = {};

io.on("connection", (socket) => {
  console.log("User connected");

  // регистрация ника
  socket.on("register", (nick) => {
    if (!nick) return;
    socket.nick = nick;
    users[nick] = socket.id;
    io.emit("users", Object.keys(users));
  });

  // отправка сообщений
  socket.on("chat message", (data) => {
    // data: { text, to }
    if (data.to) {
      const targetSocketId = users[data.to];
      if (targetSocketId) {
        // приватное сообщение: отправляем только отправителю и получателю
        socket.emit("chat message", { ...data, private: true });
        io.to(targetSocketId).emit("chat message", { ...data, private: true });
      }
    } else {
      // общий чат
      io.emit("chat message", { ...data, private: false });
    }
  });

  socket.on("disconnect", () => {
    if (socket.nick) {
      delete users[socket.nick];
      io.emit("users", Object.keys(users));
    }
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});