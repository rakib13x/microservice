import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Admin Service API",
    description: "Automatically generated Swagger docs",
    version: "1.0.0",
  },
  host: "localhost:6005",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/admin.routes.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
