import mongoose from "mongoose";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
	BadRequestError,
	NotFoundError,
	OrderStatus,
	requireAuth,
	validateRequest,
} from "@bozhatickets/common";

import { natsWrapper } from "../nats-wrapper";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { Ticket } from "../models/ticket";
import { Order } from "../models/order";

const router = express.Router();
const EXPIRATION_WINDOW_SECONDS = 300; // test only: 15 * 60;

router.post(
	"/api/orders",
	requireAuth,
	[
		body("ticketId")
			.not()
			.isEmpty()
			.custom((input: string) => mongoose.Types.ObjectId.isValid(input))
			.withMessage("TicketId is required"),
	],
	validateRequest,
	async (req: Request, res: Response) => {
		// Find the ticket the user is trying to order
		const { ticketId } = req.body;
		const ticket = await Ticket.findById(ticketId);
		if (!ticket) {
			throw new NotFoundError();
		}

		// Make sure the ticket is not already reserved
		// Run query to find order where the ticket we found above and the orders status is not cancelled.
		// If we find an order, it means the ticket is reserved.
		const isReserved = await ticket.isReserved();
		if (isReserved) {
			throw new BadRequestError("Ticket is already reserved.");
		}

		// Calculate an expiration date for the order
		const expiration = new Date();
		expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

		// Build the order and save to database
		const order = Order.build({
			userId: req.currentUser!.id,
			status: OrderStatus.Created,
			expiresAt: expiration,
			ticket,
		});
		await order.save();

		// Publish an event saying that an order was created
		new OrderCreatedPublisher(natsWrapper.client).publish({
			id: order.id,
			version: order.version,
			status: order.status,
			userId: order.userId,
			expiresAt: order.expiresAt.toISOString(), // UTC time
			ticket: {
				id: ticket.id,
				price: ticket.price,
			},
		});

		res.status(201).send(order);
	}
);

export { router as createOrderRouter };
