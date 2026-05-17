import prisma from "../lib/prisma.js";
import { hashPassword, comparePassword, signToken } from "../utils/index.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";

// ─── Custom error for known business-logic failures ──────

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ─── Register ────────────────────────────────────────────

/**
 * Creates a new user after validating uniqueness and hashing the password.
 * Throws `AuthError(409)` if the email is already taken.
 */
export async function registerUser(data: RegisterInput): Promise<void> {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AuthError("Email already registered", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });
}

// ─── Login ───────────────────────────────────────────────

/**
 * Authenticates a user by email + password.
 * Returns a signed JWT on success.
 * Throws `AuthError(401)` on bad credentials (intentionally vague).
 */
export async function loginUser(
  data: LoginInput
): Promise<{ access_token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AuthError("Invalid email or password", 401);
  }

  const passwordMatch = await comparePassword(data.password, user.password);

  if (!passwordMatch) {
    throw new AuthError("Invalid email or password", 401);
  }

  const token = signToken({ userId: user.id, email: user.email });

  return { access_token: token };
}
