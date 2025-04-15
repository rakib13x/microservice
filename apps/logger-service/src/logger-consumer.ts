import { kafka } from "@packages/utils/kafka";
import { clients } from "./main";

const consumer = kafka.consumer({ groupId: "log-events-group" });
const logQueue: string[] = [];

// WebSocket processing function for logs
const processLogs = () => {
  if (logQueue.length === 0) return;

  console.log(`Processing ${logQueue.length} logs in batch...`);
  const logs = [...logQueue];
  logQueue.length = 0; // Clear log queue before processing

  // Send logs to WebSocket clients
  clients.forEach((client: any) => {
    logs.forEach((log) => {
      client.send(log); // Send each log to the client
    });
  });
};

// Run log processing every 3 seconds
setInterval(processLogs, 3000);

// Consume log messages from Kafka
export const consumeKafkaMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "logs", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const logMessage = message.value.toString();
      console.log(`Received log:`, logMessage);
      logQueue.push(logMessage); // Store logs temporarily for real-time sending via WebSocket
    },
  });
};

// Start Kafka consumer
consumeKafkaMessages().catch(console.error);
