import express from "express";
import {
  endSession,
  removeFee,
  forceEndSession,
  cutFee,
  getLimitedSessions,
  getSessions,
  getUserSessions,
  startSession,
  updateActivity,
  getActiveSession,
} from "../controllers/session.controller.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getLimitedSessions);

router.get("/all", auth, getSessions); // For testing purpose, will be removed in p

router.get("/user/:userId", auth, getUserSessions);

router.put("/remove-fee", auth, removeFee);

router.put("/cut-fee", auth, cutFee);

router.post("/start", startSession);

router.put("/activity", updateActivity);

router.post("/end", endSession);

router.post("/force-end", auth, forceEndSession);

router.get("/active-session", getActiveSession);

router.get("/ping", (req, res) => {
  console.log("Checking internet connection...");
  
  res.status(200).send("Pong");
});

export default router;
