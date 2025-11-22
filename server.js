const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

// храним соответствие сокета → ник
const users = {};

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("register", (nick) => {
    users[nick] = socket.id;
    socket.nick = nick;
    io.emit("users", Object.keys(users)); // обновляем список пользователей
  });

  socket.on("chat message", (data) => {
    // data: {text, to} — если to задано, отправляем только выбранному
    if (data.to) {
      const targetSocketId = users[data.to];
      if (targetSocketId) {
        socket.emit("chat message", { ...data, private: true });
        io.to(targetSocketId).emit("chat message", { ...data, private: true });
      }
    } else {
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