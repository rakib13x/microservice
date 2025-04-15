import { kafka } from "@packages/utils/kafka";
import WebSocket from "ws";
import { updateUserAnalytics } from "./services/analytics.service";
import { updateShopAnalytics } from "./services/shop-analytics.service";

const consumer = kafka.consumer({ groupId: "user-events-group" });
const logConsumer = kafka.consumer({ groupId: "log-events-group" });

const eventQueue: any[] = []; // Temporary event storage
const logQueue: string[] = []; // Temporary log storage

const wsServer = new WebSocket.Server({ noServer: true });

// WebSocket connection handling
const clients = new Set();

wsServer.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
  });
});

// Log consumer for receiving logs from Kafka and sending them via WebSocket
const processLogs = () => {
  if (logQueue.length === 0) return;

  console.log(`Processing ${logQueue.length} logs in batch...`);
  const logs = [...logQueue];
  logQueue.length = 0; // Clear the log queue before processing

  // Send logs to WebSocket clients
  clients.forEach((client: any) => {
    logs.forEach((log) => {
      client.send(log);
    });
  });
};

// Run log processing every 3 seconds
setInterval(processLogs, 3000);

const processQueue = async () => {
  if (eventQueue.length === 0) return;

  console.log(`Processing ${eventQueue.length} events in batch...`);
  const events = [...eventQueue];
  eventQueue.length = 0; // Clear queue before processing

  for (const event of events) {
    if (event.action === "shop_visit") {
      await updateShopAnalytics(event);
    }
    const validActions = [
      "add_to_wishlist",
      "add_to_cart",
      "product_view",
      "remove_from_wishlist",
    ];
    if (!event.action || !validActions.includes(event.action)) {
      continue;
    }
    try {
      await updateUserAnalytics(event);
    } catch (err) {
      console.error("Error processing event:", err);
    }
  }
};

// Run event processing every 3 seconds
setInterval(processQueue, 3000);

// Kafka consumer for user events
export const consumeKafkaMessages = async () => {
  // Connect to the Kafka broker
  await consumer.connect();
  await consumer.subscribe({ topic: "user-events", fromBeginning: false });

  // Connect to the Kafka broker for logs
  await logConsumer.connect();
  await logConsumer.subscribe({ topic: "logs", fromBeginning: false });

  // Consume user events
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());
      eventQueue.push(event); // Store event in memory instead of writing to DB immediately
    },
  });

  // Consume log events
  await logConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const logMessage = message.value.toString();

      console.log(`Received log:`, logMessage);
      logQueue.push(logMessage); // Store logs temporarily
    },
  });
};

// Start Kafka message consumption
consumeKafkaMessages().catch(console.error);
