import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "User Service API",
    description: "Automatically generated Swagger docs",
    version: "1.0.0",
  },
  host: "localhost:6007",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/user.routes.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
