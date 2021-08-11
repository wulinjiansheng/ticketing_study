import express, { Request, Response } from "express";
import { NotFoundError } from "@bozhatickets/common";

import { Ticket } from "../models/ticket";

const router = express.Router();

router.get("/api/tickets", async (req: Request, res: Response) => {
	// Get tickets that haven't been reserved/paid
	const tickets = await Ticket.find({ orderId: undefined });
	res.send(tickets);
});

export { router as indexTicketRouter };
