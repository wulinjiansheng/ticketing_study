import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

declare global {
	var signin: (id?: string) => string[];
}

jest.mock("../nats-wrapper");

process.env.STRIPE_KEY =
	"sk_test_51JMjbjJsU6QBhDYe7ShecqB89NeFSsUclbpZvDOxVCc5o9lEEfnT7C04drsrKhGJ5V17BVXpW8cIc31OS0x56jMW00ilsMJSzF";

let mongo: any;
beforeAll(async () => {
	process.env.NODE_ENV = "test";
	process.env.JWT_KEY = "asdf";

	mongo = await MongoMemoryServer.create();
	const mongUri = mongo.getUri();

	await mongoose.connect(mongUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
});

beforeEach(async () => {
	jest.clearAllMocks();
	const collections = await mongoose.connection.db.collections();
	for (let collection of collections) {
		await collection.deleteMany({});
	}
});

afterAll(async () => {
	await mongo.stop();
	await mongoose.connection.close();
});

global.signin = (id?: string) => {
	// Build a JWT payload { id, email, iat }
	const payload = {
		id: id || new mongoose.Types.ObjectId().toHexString(),
		email: "test@gmail.com",
	};

	// Create the JWT
	const token = jwt.sign(payload, process.env.JWT_KEY!);

	// Build session Object {jwt: MY_JWT}
	const session = { jwt: token };

	// Turn that session into JSON
	const sessionJSON = JSON.stringify(session);

	// Take JSON and encode it as base64
	const base64 = Buffer.from(sessionJSON).toString("base64");

	// return a string thats the cookie with the encoded data
	return [`express:sess=${base64}`];
};