import { Request } from "express";

/** JWT payload embedded in the token */
export interface JwtPayload {
  userId: string;
  email: string;
}

/** Express Request augmented with authenticated user data */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

/** Pagination metadata returned with list endpoints */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
