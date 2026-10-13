import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./api";

const app = express();

app.use(cors());

app.use(helmet());

app.use(express.json());

app.use("/api", apiRoutes);

app.get("/health", (_req, res) => {
  res.json({
    service: "Health Advisor Auth Service",

    status: "Running",
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled application error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
