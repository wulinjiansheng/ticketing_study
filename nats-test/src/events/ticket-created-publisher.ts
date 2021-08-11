import { Publisher, TicketCreatedEvent, Subjects } from "@bozhatickets/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
	readonly subject = Subjects.TicketCreated;
}
