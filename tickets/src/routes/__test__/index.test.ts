import request from "supertest";
import { app } from "../../app";

const createTicket = async (title: string, price: number) => {
	return await request(app)
		.post("/api/tickets")
		.set("Cookie", global.signin())
		.send({ title, price });
};

it("can fetch list of tickets", async () => {
	await createTicket("title", 10);
	await createTicket("title2", 20);
	await createTicket("title3", 30);

	const response = await request(app).get("/api/tickets").send().expect(200);

	expect(response.body.length).toEqual(3);
});
