import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import labRoutes from "./routes/lab.routes.js";
import purposeRoutes from "./routes/purpose.routes.js";
import creditRoutes from "./routes/credit.routes.js";
import printRoutes from "./routes/print.routes.js";

import connectToMongoDB from "./config/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes setup
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/purposes", purposeRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/print", printRoutes);

// Error handling
app.use((error, req, res, next) => {
  res
    .status(500)
    .send({ message: error.message || "Server: Something went wrong" });
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// app.listen(PORT, () => {
//   connectToMongoDB();
//   console.log(`Server running on port ${PORT}`);
// });