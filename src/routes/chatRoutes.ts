import { Router } from "express";
import { handleChat } from "../controllers/chatController";

const router = Router();

// POST /api/chat — Frontend sends a message, backend sends an answer
router.post("/", handleChat);

export default router;
