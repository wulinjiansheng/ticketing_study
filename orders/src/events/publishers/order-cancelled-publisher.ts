import { Publisher, OrderCancelledEvent, Subjects } from "@bozhatickets/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
	readonly subject = Subjects.OrderCancelled;
}
