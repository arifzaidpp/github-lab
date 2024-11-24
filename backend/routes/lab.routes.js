import express from "express";
import { getLab, getAllLabStatus, addLab, getLabStatus, updateLabStatus } from "../controllers/lab.controller.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initialize", addLab);

router.get("/:computerId", getLab);

router.get("/", auth, getAllLabStatus);

router.get("/:labId", auth, getLabStatus);

router.put("/:labId", auth, updateLabStatus);

export default router;
