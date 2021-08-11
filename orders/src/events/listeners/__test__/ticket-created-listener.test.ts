import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { TicketCreatedEvent } from "@bozhatickets/common";
import { TicketCreatedListener } from "../ticket-created-listener";

import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
	// create the listener
	const listener = new TicketCreatedListener(natsWrapper.client);

	// create a fake event
	const data: TicketCreatedEvent["data"] = {
		version: 0,
		id: new mongoose.Types.ObjectId().toHexString(),
		title: "test",
		price: 10,
		userId: new mongoose.Types.ObjectId().toHexString(),
	};

	// create a fake message object
	// @ts-ignore
	const msg: Message = {
		ack: jest.fn(),
	};

	return { listener, data, msg };
};

it("creates and saves a ticket", async () => {
	const { listener, data, msg } = await setup();
	// call onMessage function with data object + message object
	await listener.onMessage(data, msg);

	// write assertions to make sure a ticket was created
	const ticket = await Ticket.findById(data.id);

	expect(ticket).toBeDefined();
	expect(ticket!.title).toEqual(data.title);
	expect(ticket!.price).toEqual(data.price);
});

it("acks the message", async () => {
	const { listener, data, msg } = await setup();

	// call onMessage function with data object + message object
	await listener.onMessage(data, msg);

	// write assertions to make sure message.ack is called
	expect(msg.ack).toHaveBeenCalled();
});
