import express, { Request, Response } from "express";
import {
	requireAuth,
	NotFoundError,
	NotAuthorizedError,
	OrderStatus,
} from "@bozhatickets/common";

import { natsWrapper } from "../nats-wrapper";
import { Order } from "../models/order";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";

const router = express.Router();

router.delete(
	"/api/orders/:orderId",
	requireAuth,
	async (req: Request, res: Response) => {
		const order = await Order.findById(req.params.orderId).populate("ticket");
		if (!order) {
			throw new NotFoundError();
		}
		if (order.userId != req.currentUser!.id) {
			throw new NotAuthorizedError();
		}

		order.status = OrderStatus.Cancelled;
		await order.save();

		new OrderCancelledPublisher(natsWrapper.client).publish({
			id: order.id,
			version: order.version,
			ticket: {
				id: order.ticket.id,
				price: order.ticket.price,
			},
		});

		res.status(204).send(order);
	}
);

export { router as deleteOrderRouter };
