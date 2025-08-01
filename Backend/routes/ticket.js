import express from "express"
import { authenticate } from "../middlewares/auth.js"
import { createTicket, getAllTickets, getTicket } from "../controllers/ticket.js"

const router = express.Router()

router.get("/", authenticate, getAllTickets);
router.get("/:id", authenticate, getTicket);
router.post("/", authenticate, createTicket);

export default router