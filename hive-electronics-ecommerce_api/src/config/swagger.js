import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Hive Electronics Ecommerce API",
      version: "1.0.0",
      description:
        "REST API for the Hive Electronics ecommerce platform (Express + Mongoose).",
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Local development server",
      },
      {
        url: "https://hive-electronics-ecommerce-full.onrender.com",
        description: "Production server (Render)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/config/swaggerComponents.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
