import { z } from "zod";

/**
 * Registration request body schema.
 * - `name`:     1–100 chars
 * - `email`:    valid email format
 * - `password`: min 8 chars, at least one uppercase, one lowercase, one digit
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "Name must be at most 100 characters")
    .optional()
    .default(""),

  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
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
