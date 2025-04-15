import express from "express";
import WebSocket from "ws";
import http from "http";
import { consumeKafkaMessages } from "./logger-consumer";

const app = express();

// Define the WebSocket server on a specific port
const wsServer = new WebSocket.Server({ noServer: true });

// A set to keep track of WebSocket clients
export const clients = new Set();

// Handle incoming WebSocket connections
wsServer.on("connection", (ws) => {
  console.log("New WebSocket connection");
  clients.add(ws);

  // Handle WebSocket close event
  ws.on("close", () => {
    console.log("WebSocket connection closed");
    clients.delete(ws);
  });
});

// Set up Express to handle WebSocket upgrade requests
const server = http.createServer(app);

// Upgrade WebSocket connection when necessary
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit("connection", ws, request);
  });
});

// Start the server
server.listen(process.env.PORT || 6004, () => {
  console.log(`Listening at http://localhost:${process.env.PORT || 6004}`);
});

// Start Kafka consumer
consumeKafkaMessages();
