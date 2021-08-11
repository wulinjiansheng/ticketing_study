import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderCreatedEvent, OrderStatus } from "@bozhatickets/common";
import { OrderCreatedListener } from "../order-created-listener";

import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
	// create the listener
	const listener = new OrderCreatedListener(natsWrapper.client);

	// create and save a ticket
	const ticket = Ticket.build({
		title: "test",
		price: 20,
		userId: mongoose.Types.ObjectId().toHexString(),
	});
	await ticket.save();

	// create a fake order created event
	const data: OrderCreatedEvent["data"] = {
		id: new mongoose.Types.ObjectId().toHexString(),
		version: 1,
		status: OrderStatus.Created,
		userId: new mongoose.Types.ObjectId().toHexString(),
		expiresAt: new Date().toString(),
		ticket: {
			id: ticket.id,
			price: ticket.price,
		},
	};

	// create a fake message object
	// @ts-ignore
	const msg: Message = {
		ack: jest.fn(),
	};

	return { listener, ticket, data, msg };
};

it("sets the userId of the ticket", async () => {
	const { listener, ticket, data, msg } = await setup();
	// call onMessage function with data object + message object
	await listener.onMessage(data, msg);

	// write assertions to make sure a ticket was created
	const updatedTicket = await Ticket.findById(ticket.id);

	expect(updatedTicket).toBeDefined();
	expect(updatedTicket!.orderId).toEqual(data.id);
});

it("acks the message", async () => {
	const { listener, data, msg } = await setup();

	// call onMessage function with data object + message object
	await listener.onMessage(data, msg);

	// write assertions to make sure message.ack is called
	expect(msg.ack).toHaveBeenCalled();
});

it("publishes a ticket updated event", async () => {
	const { listener, data, msg } = await setup();
	await listener.onMessage(data, msg);
	expect(natsWrapper.client.publish).toHaveBeenCalled();

	const ticketUpdatedData = JSON.parse(
		(natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
	);

	expect(data.id).toEqual(ticketUpdatedData.orderId);
});
