import express from "express";
import { createWebSocketServer } from "./websocket";

const app = express();

app.get("/api", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});

const port = process.env.PORT || 6009;
const server = app.listen(port, () => {
  console.log(`HTTP Server Listening at http://localhost:${port}/api`);
});

// WebSocket Server setup
createWebSocketServer(server);

server.on("error", console.error);
