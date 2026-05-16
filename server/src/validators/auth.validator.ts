import { z } from "zod";

/**
 * Registration request body schema.
 * - `name`:     1–100 chars
 * - `email`:    valid email format
 * - `password`: min 8 chars, at least one uppercase, one lowercase, one digit
 */
export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),

  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),

  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});

/**
 * Login request body schema.
 */
export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Invalid email address"),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

/** Inferred types for use in services / controllers */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
