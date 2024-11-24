import express from "express";
import { createPurpose, deletePurpose, getPurposes, updatePurpose } from "../controllers/purpose.controller.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPurposes);

router.post("/", auth, createPurpose);

router.put("/:id", auth, updatePurpose);

router.delete("/:id", auth, deletePurpose);


export default router;
