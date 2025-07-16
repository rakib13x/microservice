import express from "express";
import productRoutes from "./routes/product.routes";

const app: express.Application = express();
const port = process.env.PORT || 6002;

app.use("/api", productRoutes);

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/", (req, res) => {
  res.json({ message: "Product service is running" });
});

app.listen(port, () => {
  console.log(`Product service is running at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/docs`);
});

export default app;
