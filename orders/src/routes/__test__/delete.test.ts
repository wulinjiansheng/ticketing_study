import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import { Order, OrderStatus } from "../../models/order";

import { natsWrapper } from "../../nats-wrapper";

it("returns an error if one user tries to fetch another users order", async () => {
	// Create a ticket
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 20,
	});
	await ticket.save();

	const user = global.signin();
	// make a request to build an order with this ticket
	const { body: order } = await request(app)
		.post("/api/orders")
		.set("Cookie", user)
		.send({ ticketId: ticket.id })
		.expect(201);

	// make request to cancel the order
	await request(app)
		.delete(`/api/orders/${order.id}`)
		.set("Cookie", global.signin())
		.send()
		.expect(401);
});

it("marks an order as cancelled", async () => {
	// create a ticket with Ticket Model
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 20,
	});
	await ticket.save();

	const user = global.signin();
	// make a request to create an order
	const { body: order } = await request(app)
		.post("/api/orders")
		.set("Cookie", user)
		.send({ ticketId: ticket.id })
		.expect(201);

	// make a request to cancel the order
	await request(app)
		.delete(`/api/orders/${order.id}`)
		.set("Cookie", user)
		.send()
		.expect(204);

	// expectation to make sure the thing is cancelled
	const updatedOrder = await Order.findById(order.id);

	expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("emits a order cancelled event", async () => {
	// create a ticket with Ticket Model
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "concert",
		price: 20,
	});
	await ticket.save();

	const user = global.signin();
	// make a request to create an order
	const { body: order } = await request(app)
		.post("/api/orders")
		.set("Cookie", user)
		.send({ ticketId: ticket.id })
		.expect(201);

	// make a request to cancel the order
	await request(app)
		.delete(`/api/orders/${order.id}`)
		.set("Cookie", user)
		.send()
		.expect(204);

	// expectation to make sure the thing is cancelled
	const updatedOrder = await Order.findById(order.id);

	expect(natsWrapper.client.publish).toHaveBeenCalled();
});
