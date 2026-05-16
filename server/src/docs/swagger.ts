import swaggerJsdoc from "swagger-jsdoc";
import path from "node:path";

// ─── OpenAPI 3.0 Definition ─────────────────

const swaggerDefinition: swaggerJsdoc.SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Fi Money Notes API",
    version: "1.0.0",
    description:
      "A production-grade multi-user Notes Application API with JWT authentication, " +
      "note sharing, version history, and full-text search. Built with Express, " +
      "Prisma ORM, and PostgreSQL (NeonDB).",
    contact: {
      name: "API Support",
    },
    license: {
      name: "ISC",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Health", description: "Health check and metadata endpoints" },
    { name: "Auth", description: "User registration and login" },
    { name: "Notes", description: "CRUD operations on notes" },
    { name: "Sharing", description: "Note sharing and collaboration" },
    { name: "Search", description: "Full-text note search" },
  ],

  // ─── Reusable Components ────────────────────
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from POST /auth/login",
      },
    },
    schemas: {
      // ── Request Bodies ──
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            example: "John Doe",
            minLength: 1,
            maxLength: 100,
          },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "SecurePass1",
            description:
              "Min 8 chars, at least one uppercase, one lowercase, one digit",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "SecurePass1",
          },
        },
      },
      CreateNoteRequest: {
        type: "object",
        required: ["title", "content"],
        properties: {
          title: { type: "string", example: "Meeting Notes", maxLength: 255 },
          content: {
            type: "string",
            example: "Discussed project timeline and deliverables.",
          },
        },
      },
      UpdateNoteRequest: {
        type: "object",
        properties: {
          title: { type: "string", example: "Updated Meeting Notes" },
          content: { type: "string", example: "Revised project timeline." },
          isPinned: { type: "boolean", example: false },
          isArchived: { type: "boolean", example: false },
        },
      },
      ShareNoteRequest: {
        type: "object",
        required: ["sharedWithUserId"],
        properties: {
          sharedWithUserId: {
            type: "string",
            format: "uuid",
            example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          },
          permission: {
            type: "string",
            enum: ["READ", "EDIT"],
            default: "READ",
            example: "READ",
          },
        },
      },

      // ── Response Bodies ──
      RegisterResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "User registered successfully" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          access_token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      Note: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          content: { type: "string" },
          isPinned: { type: "boolean" },
          isArchived: { type: "boolean" },
          isDeleted: { type: "boolean" },
          ownerId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SharedNote: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          noteId: { type: "string", format: "uuid" },
          sharedWithUserId: { type: "string", format: "uuid" },
          permission: { type: "string", enum: ["READ", "EDIT"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      NoteVersion: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          noteId: { type: "string", format: "uuid" },
          version: { type: "integer" },
          title: { type: "string" },
          content: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      // ── Error Responses ──
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Error message" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
            example: {
              email: ["Invalid email address"],
              password: ["Password must be at least 8 characters"],
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Access denied — missing or invalid JWT token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { message: "Access denied. No token provided." },
          },
        },
      },
      NotFoundError: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { message: "Record not found" },
          },
        },
      },
      ValidationError: {
        description: "Request body validation failed",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ValidationErrorResponse",
            },
          },
        },
      },
      InternalServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { message: "Internal server error" },
          },
        },
      },
    },
  },
};

// ─── swagger-jsdoc options ──────────────────

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  // Scan all route files for @swagger JSDoc annotations
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../server.ts"),
    path.join(__dirname, "../server.js"),
  ],
};

/** Auto-generated OpenAPI specification object */
export const swaggerSpec = swaggerJsdoc(options);
