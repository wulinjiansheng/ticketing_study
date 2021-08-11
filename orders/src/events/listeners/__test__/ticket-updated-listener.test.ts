import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { TicketUpdatedEvent } from "@bozhatickets/common";
import { TicketUpdatedListener } from "../ticket-updated-listener";

import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
	// create the listener
	const listener = new TicketUpdatedListener(natsWrapper.client);

	// create and save a ticket
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: "test",
		price: 20,
	});
	await ticket.save();

	// create a fake data object
	const data: TicketUpdatedEvent["data"] = {
		id: ticket.id,
		version: ticket.version + 1,
		title: "test2",
		price: 30,
		userId: new mongoose.Types.ObjectId().toHexString(),
	};

	// create a fake message object
	// @ts-ignore
	const msg: Message = {
		ack: jest.fn(),
	};

	return { listener, data, msg, ticket };
};

it("finds, updates, and saves a ticket", async () => {
	const { listener, data, msg, ticket } = await setup();
	// call onMessage function with data object + message object
	await listener.onMessage(data, msg);

	// write assertions to make sure the ticket was updated
	const updatedTicket = await Ticket.findById(data.id);

	expect(updatedTicket).toBeDefined();
	expect(updatedTicket!.title).toEqual(data.title);
	expect(updatedTicket!.price).toEqual(data.price);
	expect(updatedTicket!.version).toEqual(data.version);
});

it("acks the message", async () => {
	const { listener, data, msg } = await setup();

	// call onMessage function with data object + message object
	await listener.onMessage(data, msg);

	// write assertions to make sure message.ack is called
	expect(msg.ack).toHaveBeenCalled();
});

it("doesn't call ack if the event has a skipped version number", async () => {
	const { listener, data, msg, ticket } = await setup();
	data.version = ticket.version + 10;

	try {
		// call onMessage function with data object + message object
		await listener.onMessage(data, msg);
	} catch (err) {}

	// write assertions to make sure message.ack is not called
	expect(msg.ack).not.toHaveBeenCalled();
});
