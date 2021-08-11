export const natsWrapper = {
	client: {
		publish: jest
			.fn()
			.mockImplementation(
				(subject: string, data: string, callback: () => void) => {
					console.log("subject:", subject);
					console.log("data:", data);
					callback();
				}
			),
	},
};
