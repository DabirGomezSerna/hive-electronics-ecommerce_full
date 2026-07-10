import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const createApp = () => {
  const app = express();

  app.use(cors({ origin: "http://localhost:3000", credentials: true }));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("API Ecommerce with MongoDB");
  });

  app.use("/api", routes);

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
