const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const https = require("https");
const option = {
  cert: fs.readFileSync("./ssl/ca.crt"),
  key: fs.readFileSync("./ssl/ca.key"),
};
const server = https.createServer(option, app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = 3000;
// const { v4: uuidv4 } = require("uuid");
// const { Socket } = require("dgram");

app.set("view engine", "ejs");
// app.get('/', (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// })

app.use(express.static(path.join(__dirname, ".", "public")));

app.get("/:index", (req, res) => {
  res.render("index", { roomId: req.params.index });
});

io.on("connection", (socket) => {
  console.log("user connected " + socket.id);
  socket.join("room1");
  const joinedUsers = io.sockets.adapter.rooms.get("room1");
  console.log("user connected " + joinedUsers.size);
  if (joinedUsers.size > 1) {
    socket.emit("ada user lain", [...joinedUsers]);
  }

  socket.on("offer", ({ offer, to: targetId, from }) => {
    io.to(targetId).emit("offer", { offer, from });
    console.log("sending offer from " + from + " to " + targetId);
  });

  socket.on("answer", ({ answer, to: targetId, from }) => {
    io.to(targetId).emit("answer", { answer, from });
    console.log("sending answer from " + from + " to " + targetId);
  });

  socket.on("ice candidate", ({ iceCandidate, to: targetId }) => {
    io.to(targetId).emit("ice candidate", iceCandidate);
    console.log("sending ice candidate to " + targetId);
  });

  socket.on("ice added", () => {
    console.log("ice added");
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
