import express from "express";
import { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { validateRequest, BadRequestError } from "@bozhatickets/common";

import { User } from "../models/user";
import { Password } from "../services/password";

const router = express.Router();

router.post(
	"/api/users/signin",
	[
		body("email").isEmail().withMessage("Email must be valid."),
		body("password")
			.trim()
			.notEmpty()
			.withMessage("You must apply a password."),
	],
	validateRequest,
	async (req: Request, res: Response) => {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			throw new BadRequestError("Invalid credentials");
		}

		const passwordsMatch = await Password.compare(user.password, password);
		if (!passwordsMatch) {
			throw new BadRequestError("Invalid credentials");
		}

		// Generate JWT
		const userJWT = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_KEY!
		);

		// Store it on session object
		req.session = {
			jwt: userJWT,
		};

		res.status(200).send(user);
	}
);

export { router as signinRouter };
