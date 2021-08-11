import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";

import { natsWrapper } from "../../nats-wrapper";
import { Ticket } from "../../models/ticket";

it("returns a 404 if the provided id does not exist", async () => {
	const id = new mongoose.Types.ObjectId().toHexString();
	await request(app)
		.put(`/api/tickets/${id}`)
		.set("Cookie", global.signin())
		.send({
			title: "title",
			price: 20,
		})
		.expect(404);
});

it("returns a 401 if the user is not authenticated", async () => {
	const id = new mongoose.Types.ObjectId().toHexString();
	await request(app)
		.put(`/api/tickets/${id}`)
		.send({
			title: "title",
			price: 20,
		})
		.expect(401);
});

it("returns a 401 if the user is does not own the ticket", async () => {
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", global.signin())
		.send({ title: "title", price: 20 });

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", global.signin())
		.send({ title: "title2", price: 30 })
		.expect(401);
});

it("returns a 400 if an invalid title or price is provided", async () => {
	const cookie = global.signin();
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", cookie)
		.send({ title: "title", price: 20 });

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({ title: "", price: 20 })
		.expect(400);

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({ title: "title", price: -10 })
		.expect(400);
});

it("rejects updates if the ticket is reserved", async () => {
	const cookie = global.signin();
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", cookie)
		.send({ title: "title", price: 20 });

	const ticket = await Ticket.findById(response.body.id);
	ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
	await ticket!.save();

	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({ title: "title2", price: 30 })
		.expect(400);
});

it("updates ticket with the provided valid inputs", async () => {
	const cookie = global.signin();
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", cookie)
		.send({ title: "title", price: 20 });

	const title = "title2";
	const price = 30;
	await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({ title, price })
		.expect(200);

	const ticketResponse = await request(app)
		.get(`/api/tickets/${response.body.id}`)
		.send();

	expect(ticketResponse.body.title).toEqual(title);
	expect(ticketResponse.body.price).toEqual(price);
});

it("publishes and event when update a ticket", async () => {
	const cookie = global.signin();
	const response = await request(app)
		.post("/api/tickets")
		.set("Cookie", cookie)
		.send({ title: "title", price: 20 });

	const title = "title2";
	const price = 30;
	const response2 = await request(app)
		.put(`/api/tickets/${response.body.id}`)
		.set("Cookie", cookie)
		.send({ title, price })
		.expect(200);

	expect(natsWrapper.client.publish).toHaveBeenCalledTimes(2);
});
