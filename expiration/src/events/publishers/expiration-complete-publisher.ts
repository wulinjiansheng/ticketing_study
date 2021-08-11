import {
	Publisher,
	ExpirationCompleteEvent,
	Subjects,
} from "@bozhatickets/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
	readonly subject = Subjects.ExpirationComplete;
}
