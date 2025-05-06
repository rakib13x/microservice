import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { kafka } from "packages/utils/kafka";

const producer = kafka.producer();

// Simple in-memory connected users map
const connectedUsers: Map<string, WebSocket> = new Map();

// Call this to start WebSocket server
export async function createWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  await producer.connect();
  console.log("Kafka producer connected.");

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("New WebSocket connection established!");

    // First message is userId for registration
    ws.once("message", (userIdBuffer) => {
      const userId = userIdBuffer.toString();
      console.log(`Registered WebSocket for userId: ${userId}`);
      connectedUsers.set(userId, ws);

      // Now listen for chat messages
      ws.on("message", async (rawMessage) => {
        try {
          const data = JSON.parse(rawMessage.toString());
          const { fromUserId, toUserId, messageBody } = data;

          if (!fromUserId || !toUserId || !messageBody) {
            console.warn("Invalid message format received.");
            return;
          }

          const messagePayload = {
            fromUserId,
            toUserId,
            messageBody,
            timestamp: new Date().toISOString(), // Server-side timestamp
          };

          // Instantly send to receiver if online
          const receiverSocket = connectedUsers.get(toUserId);
          if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify(messagePayload));
            console.log(`Instantly delivered message to ${toUserId}`);
          } else {
            console.log(`User ${toUserId} is offline. Message will be stored.`);
          }

          // Push to Kafka for persistence later
          await producer.send({
            topic: "chat.new_message",
            messages: [
              {
                key: toUserId, // partition by receiver
                value: JSON.stringify(messagePayload),
              },
            ],
          });

          console.log(
            `Message from ${fromUserId} to ${toUserId} pushed to Kafka.`
          );
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed.");
      // Clean up connected users
      for (const [userId, socket] of connectedUsers.entries()) {
        if (socket === ws) {
          connectedUsers.delete(userId);
          console.log(`Disconnected user ${userId}`);
          break;
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  console.log("WebSocket Server is ready!");
}
