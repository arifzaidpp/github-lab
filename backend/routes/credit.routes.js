import express from "express";
import { addCredit, limitedCredits, creditStats, credits, deleteCredit, updateCredit, userCredits } from "../controllers/credit.controller.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, limitedCredits);

router.get("/all", auth, credits);

router.post("/", auth, addCredit);

router.get("/user/:userId", auth, userCredits);

router.put("/:id", auth, updateCredit);

router.delete("/:id", auth, deleteCredit);

router.get("/stats", auth, creditStats); 

export default router;
