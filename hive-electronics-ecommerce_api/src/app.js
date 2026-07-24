import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import swaggerSpec from "./config/swagger.js";

const createApp = () => {
  const app = express();

  app.use(cors({ origin: "http://localhost:3000", credentials: true }));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("API Ecommerce with MongoDB");
  });

  app.use("/api", routes);

  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_DOCS === "true") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/api-docs.json", (req, res) => {
      res.json(swaggerSpec);
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      error: "Route not found",
      method: req.method,
      url: req.originalUrl,
    });
  });

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  });

  return app;
};

export default createApp;
