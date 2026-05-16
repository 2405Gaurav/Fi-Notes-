const API_BASE = "http://localhost:3000";

/** Helper to build headers with optional auth token */
function headers(token?: string | null): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Generic response handler — throws on non-2xx */
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { message?: string }).message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

// ─── Auth ────────────────────────────────────

export async function apiRegister(
  name: string,
  email: string,
  password: string
) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ access_token: string }>(res);
}

// ─── Notes ───────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export async function apiFetchNotes(token: string): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes`, {
    headers: headers(token),
  });
  return handleResponse<Note[]>(res);
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
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message || `Error ${res.status}`
    );
  }
}

// ─── Sharing ─────────────────────────────────

export async function apiShareNote(
  token: string,
  noteId: string,
  email: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/notes/${noteId}/share`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ share_with_email: email }),
  });
  return handleResponse<{ message: string }>(res);
}
