import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import router from "./routes/order.route";
import { createOrder } from "./controllers/order.controller";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.post(
  "/api/create-order",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    console.log("🚨 WEBHOOK HIT - Raw middleware");
    console.log("- Method:", req.method);
    console.log("- URL:", req.url);
    console.log("- Content-Type:", req.headers["content-type"]);
    console.log("- User-Agent:", req.headers["user-agent"]);
    console.log("- Body length:", req.body ? req.body.length : 0);
    console.log("- Stripe signature present:", !!req.headers["stripe-signature"]);
    console.log("- Headers:", JSON.stringify(req.headers, null, 2));

    (req as any).rawBody = req.body;
    next();
  },
  createOrder
);

// Also add a test endpoint to verify your server is reachable
app.get("/api/webhook-test", (req, res) => {
  console.log("🧪 Webhook test endpoint hit");
  res.json({
    message: "Webhook endpoint is reachable",
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Add a POST test endpoint
app.post("/api/webhook-test", bodyParser.json(), (req, res) => {
  console.log("🧪 POST Webhook test endpoint hit");
  console.log("Body:", req.body);
  res.json({
    message: "POST Webhook endpoint is reachable",
    timestamp: new Date().toISOString(),
    receivedBody: req.body
  });
});
app.get("/api/webhook-test", (req, res) => {
  res.json({ message: "Server is reachable", timestamp: new Date() });
});




app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to order-service!" });
});

// Routes
app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
