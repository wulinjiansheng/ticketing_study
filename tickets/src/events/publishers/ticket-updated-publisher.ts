import { Publisher, TicketUpdatedEvent, Subjects } from "@bozhatickets/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
	readonly subject = Subjects.TicketUpdated;
}
