import express from "express";
import { addPrint, printStats, limitedPrints, allPrints, deletePrint, updatePrint, userPrints } from "../controllers/print.controller.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, limitedPrints);

router.get("/all", auth, allPrints);

router.post("/", auth, addPrint);

router.get("/user/:userId", auth, userPrints);

router.put("/:id", auth, updatePrint);

router.delete("/:id", auth, deletePrint);

router.get("/stats", auth, printStats);

export default router;
