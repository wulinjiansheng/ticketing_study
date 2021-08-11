import { Publisher, OrderCreatedEvent, Subjects } from "@bozhatickets/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
	readonly subject = Subjects.OrderCreated;
}
