const API_BASE = "https://fi-notes-pu55.onrender"; 

/** Helper to build headers with optional auth token */
function headers(token?: string | null): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Generic response handler — throws on non-2xx with clear messages */
async function handleResponse<T>(res: Response): Promise<T> {
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // Response body wasn't JSON — fall through to status check
  }

  if (!res.ok) {
    // ── Rate limit: include Retry-After info ──
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After") || res.headers.get("ratelimit-reset");
      let waitMsg = "Please wait a moment and try again.";
      if (retryAfter) {
        const secs = parseInt(retryAfter, 10);
        if (!isNaN(secs) && secs > 0) {
          const mins = Math.ceil(secs / 60);
          waitMsg = mins > 1
            ? `Please wait ${mins} minutes before trying again.`
            : `Please wait about a minute before trying again.`;
        }
      }
      throw new Error(`Too many requests. ${waitMsg}`);
    }

    // Use the server's message if available, otherwise provide a clear fallback
    const serverMsg = (data as { message?: string }).message;
    if (serverMsg) throw new Error(serverMsg);

    // Status-specific fallbacks
    switch (res.status) {
      case 401:
        throw new Error("Session expired. Please log in again.");
      case 403:
        throw new Error("You are not authorized to perform this action.");
      case 404:
        throw new Error("The requested resource was not found.");
      case 409:
        throw new Error("This action has already been performed.");
      default:
        throw new Error("Something went wrong. Please try again.");
    }
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────

// ─── Auth ────────────────────────────────────

export async function apiRegister(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/register`, {   // ← was /auth/register
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {      // ← was /auth/login
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ access_token: string }>(res);
}

// ─── Notes ───────────────────────────────────

export interface SharedUser {
  userId: string;
  email: string;
  name: string;
  permission: "READ" | "EDIT";
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  /** Current user's role: OWNER, READ, or EDIT */
  permission: "OWNER" | "READ" | "EDIT";
  /** Who shared the note (non-null only for shared notes) */
  sharedBy: { email: string; name: string } | null;
  /** Collaborators list (non-empty only for owned notes) */
  sharedWith: SharedUser[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  query?: string;
}

export interface PaginatedResponse {
  notes: Note[];
  meta: PaginationMeta;
}

export async function apiFetchNotes(
  token: string,
  page = 1,
  limit = 20,
  search?: string,
  deleted?: boolean
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  if (deleted) params.set("deleted", "true");

  const res = await fetch(`${API_BASE}/notes?${params}`, {
    headers: headers(token),
  });
  return handleResponse<PaginatedResponse>(res);
}

export async function apiSearchNotes(
  token: string,
  q: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`${API_BASE}/search?${params}`, {
    headers: headers(token),
  });
  return handleResponse<PaginatedResponse>(res);
}

export async function apiCreateNote(
  token: string,
  data: { title: string; content: string }
): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  return handleResponse<Note>(res);
}

export async function apiUpdateNote(
  token: string,
  id: string,
  data: Partial<Pick<Note, "title" | "content" | "isPinned" | "isArchived">>
): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  return handleResponse<Note>(res);
}

export async function apiDeleteNote(
  token: string,
  id: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) await handleResponse(res);
}

// ─── Sharing ─────────────────────────────────

export async function apiShareNote(
  token: string,
  noteId: string,
  email: string,
  permission: "READ" | "EDIT" = "READ"
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/notes/${noteId}/share`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ share_with_email: email, permission }),
  });
  return handleResponse<{ message: string }>(res);
}

// ─── Trash Actions ───────────────────────────

export async function apiRestoreNote(
  token: string,
  noteId: string
): Promise<{ message: string; note: Note }> {
  const res = await fetch(`${API_BASE}/notes/${noteId}/restore`, {
    method: "POST",
    headers: headers(token),
  });
  return handleResponse<{ message: string; note: Note }>(res);
}

export async function apiPermanentDeleteNote(
  token: string,
  noteId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${noteId}/permanent`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) await handleResponse(res);
}

// ─── Version History ─────────────────────────

export interface NoteVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface VersionsResponse{
  versions: NoteVersion[];
  meta: PaginationMeta;
}

export async function apiGetNoteVersions(
  token: string,
  noteId: string,
  page = 1,
  limit = 20
): Promise<VersionsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/notes/${noteId}/versions?${params}`, {
    headers: headers(token),
  });
  return handleResponse<VersionsResponse>(res);
}

