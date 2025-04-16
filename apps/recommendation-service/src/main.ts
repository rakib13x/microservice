import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/recommendation.routes";
import swaggerUi from "swagger-ui-express";
const swaggerDocument = require("./swagger-output.json");

export const app = express();

app.get("/", (req, res) => {
  res.send({ message: "Hello Recommendation API" });
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (req, res) => {
  res.json(swaggerDocument);
});

// Routes
app.use("/api", router);

const port = process.env.PORT || 6008;
const server = app.listen(port, () => {
  console.log(`Recommendation Service running at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/docs`);
});

// Handle Server Errors
server.on("error", (err) => {
  console.error("Server Error:", err);
});
