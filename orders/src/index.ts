import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";

import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listener";
import { ExpirationCompleteListener } from "./events/listeners/expiration-complete-listener";
import { PaymentCreatedListener } from "./events/listeners/payment-created-listener";

const start = async () => {
	if (!process.env.JWT_KEY) {
		throw new Error("JWT_KEY must be defined.");
	}
	if (!process.env.MONGO_URL) {
		throw new Error("MONGO_URL must be defined.");
	}
	if (
		!process.env.NATS_CLUSTER_ID ||
		!process.env.NATS_CLIENT_ID ||
		!process.env.NATS_URL
	) {
		throw new Error("NATS connection info must be defined.");
	}

	try {
		await natsWrapper.connect(
			process.env.NATS_CLUSTER_ID,
			process.env.NATS_CLIENT_ID,
			process.env.NATS_URL
		);

		// Shutdown
		natsWrapper.client.on("close", () => {
			console.log("NATS connection closed!");
			process.exit();
		});
		process.on("SIGINT", () => natsWrapper.client.close());
		process.on("SIGTERM", () => natsWrapper.client.close());

		new TicketCreatedListener(natsWrapper.client).listen();
		new TicketUpdatedListener(natsWrapper.client).listen();
		new ExpirationCompleteListener(natsWrapper.client).listen();
		new PaymentCreatedListener(natsWrapper.client).listen();

		await mongoose.connect(process.env.MONGO_URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
		});
		console.log("Connected to MongoDB.");
	} catch (err) {
		console.error(err);
	}

	app.listen(3000, () => {
		console.log("Listening on port 3000.");
	});
};

start();