export abstract class CustomError extends Error {
	abstract statusCode: number;

	constructor(message: string) {
		// 'Error' breaks prototype chain here
		super(message);

		// restore prototype chain
		Object.setPrototypeOf(this, CustomError.prototype);
	}

	abstract serializeErrors(): { message: string; field?: string }[];
}
