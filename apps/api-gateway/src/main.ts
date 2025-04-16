import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import axios from "axios";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import initializeSiteConfig from "./libs/initializeSiteConfig";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user || req.seller ? 1000 : 100),
  message: { error: "Too many requests, please try again later!" },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: any) => req.ip,
});

app.use(limiter);

app.get("/gateway-health", (req, res) => {
  res.send({ message: "Welcome to api-gateway!" });
});

// Serve Docs at `/docs`
app.get("/docs", (req, res) => {
  const links = Object.keys(allSwaggerSpecs)
    .map(
      (serviceName) =>
        `<li><a href="/docs/${encodeURIComponent(
          serviceName
        )}" target="_blank">${serviceName}</a></li>`
    )
    .join("");

  res.send(`
    <html>
      <head>
        <title>Service Docs</title>
        <style>
          body { font-family: sans-serif; padding: 30px; }
          li { margin: 12px 0; }
          a { font-size: 16px; font-weight: 600; color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>📘 API Documentation</h1>
        <ul>${links}</ul>
      </body>
    </html>
  `);
});

// serve each services docs
app.use(
  "/docs/:service",
  swaggerUi.serve,
  (req: Request, res: Response, next: NextFunction) => {
    const serviceName = decodeURIComponent(req.params.service);
    const spec = allSwaggerSpecs[serviceName];

    if (!spec) {
      return res.status(404).json({ error: "Swagger spec not found." });
    }

    return swaggerUi.setup(spec, { explorer: true })(req, res, next);
  }
);

app.use("/recommendation", proxy("http://localhost:6008"));
app.use("/user", proxy("http://localhost:6007"));
app.use("/order", proxy("http://localhost:6006"));
app.use("/admin", proxy("http://localhost:6005"));
app.use("/seller", proxy("http://localhost:6003"));
app.use("/product", proxy("http://localhost:6002"));
app.use("/", proxy("http://localhost:6001"));

// Fetch Swagger JSON from Auth Service
let allSwaggerSpecs: Record<string, any> = {};

const fetchSwaggerDocs = async () => {
  try {
    const services = [
      {
        name: "Auth Service",
        url: "http://localhost:6001/docs-json",
      },
      {
        name: "Product Service",
        url: "http://localhost:6002/docs-json",
      },
      {
        name: "Seller Service",
        url: "http://localhost:6003/docs-json",
      },
      {
        name: "Admin Service",
        url: "http://localhost:6005/docs-json",
      },
      {
        name: "Order Service",
        url: "http://localhost:6006/docs-json",
      },
      {
        name: "User Service",
        url: "http://localhost:6007/docs-json",
      },
      {
        name: "Recommendation Service",
        url: "http://localhost:6008/docs-json",
      },
    ];

    for (const service of services) {
      try {
        const res = await axios.get(service.url);
        allSwaggerSpecs[service.name] = res.data;
      } catch (err: any) {
        console.error(`Failed to fetch ${service.name} docs:`, err.message);
      }
    }
  } catch (error: any) {
    console.error("Failed to fetch Swagger Docs:", error.message);
  }
};

// Initial Fetch and Refresh Every 5 Minutes
fetchSwaggerDocs();
setInterval(fetchSwaggerDocs, 5 * 60 * 1000);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log("Site config initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize site config:", error);
  }
});
server.on("error", console.error);
