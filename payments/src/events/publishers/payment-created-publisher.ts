import { Publisher, PaymentCreatedEvent, Subjects } from "@bozhatickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
	readonly subject = Subjects.PaymentCreated;
}
