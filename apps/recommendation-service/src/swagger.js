import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Recommendation Service API",
    description: "Automatically generated Swagger docs",
    version: "1.0.0",
  },
  host: "localhost:6008",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/recommendation.routes.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
