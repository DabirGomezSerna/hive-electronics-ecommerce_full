import express from "express";
import routes from "./routes/index.js";

const createApp = () => {
  const app = express();

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

  return app;
};

export default createApp;
