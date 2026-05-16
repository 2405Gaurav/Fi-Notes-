import { create } from "zustand";
import type { Note } from "../api/notesApi";
import {
  apiFetchNotes,
  apiCreateNote,
  apiUpdateNote,
  apiDeleteNote,
  apiShareNote,
} from "../api/notesApi";

// ─── Toast Types ─────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// ─── View Types ──────────────────────────────

export type ActiveView = "notes" | "shared" | "pinned" | "archive" | "trash";

// ─── Store Interface ─────────────────────────

interface AppState {
  // Auth
  user: { email: string; token: string } | null;
  login: (email: string, token: string) => void;
  logout: () => void;

  // Notes
  notes: Note[];
  notesLoading: boolean;
  fetchNotes: () => Promise<void>;
  addNote: (title: string, content: string) => Promise<void>;
  updateNote: (
    id: string,
    data: Partial<Pick<Note, "title" | "content" | "isPinned" | "isArchived">>
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  shareNote: (noteId: string, email: string) => Promise<void>;

  // UI
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  expandedNote: Note | null;
  setExpandedNote: (note: Note | null) => void;
  isComposerOpen: boolean;
  setComposerOpen: (open: boolean) => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

// ─── Persisted Token ─────────────────────────

function loadUser(): AppState["user"] {
  try {
    const raw = localStorage.getItem("keep_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Store ───────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth ──
  user: loadUser(),
  login: (email, token) => {
    const user = { email, token };
    localStorage.setItem("keep_user", JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("keep_user");
    set({ user: null, notes: [], activeView: "notes", searchQuery: "" });
  },

  // ── Notes ──
  notes: [],
  notesLoading: false,

  fetchNotes: async () => {
    const { user } = get();
    if (!user) return;
    set({ notesLoading: true });
    try {
      const notes = await apiFetchNotes(user.token);
      set({ notes, notesLoading: false });
    } catch {
      set({ notesLoading: false });
      get().addToast("Failed to load notes", "error");
    }
  },

  addNote: async (title, content) => {
    const { user } = get();
    if (!user) return;
    try {
      const note = await apiCreateNote(user.token, { title, content });
      set((s) => ({ notes: [note, ...s.notes] }));
      get().addToast("Note saved", "info");
    } catch (err) {
      get().addToast(
        err instanceof Error ? err.message : "Failed to create note",
        "error"
      );
    }
  },

  updateNote: async (id, data) => {
    const { user } = get();
    if (!user) return;
    try {
      const updated = await apiUpdateNote(user.token, id, data);
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? updated : n)),
        expandedNote: s.expandedNote?.id === id ? updated : s.expandedNote,
      }));
    } catch (err) {
      get().addToast(
        err instanceof Error ? err.message : "Failed to update note",
        "error"
      );
    }
  },

  deleteNote: async (id) => {
    const { user } = get();
    if (!user) return;
    try {
      await apiDeleteNote(user.token, id);
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      get().addToast("Note moved to trash", "info");
    } catch (err) {
      get().addToast(
        err instanceof Error ? err.message : "Failed to delete note",
        "error"
      );
    }
  },

  shareNote: async (noteId, email) => {
    const { user } = get();
    if (!user) return;
    try {
      await apiShareNote(user.token, noteId, email);
      get().addToast(`Note shared with ${email}`, "success");
    } catch (err) {
      throw err; // Let ShareModal handle the display
    }
  },

  // ── UI ──
  activeView: "notes",
  setActiveView: (view) => set({ activeView: view, searchQuery: "" }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  expandedNote: null,
  setExpandedNote: (note) => set({ expandedNote: note }),
  isComposerOpen: false,
  setComposerOpen: (open) => set({ isComposerOpen: open }),

  // ── Toasts ──
  toasts: [],
  addToast: (message, type = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3500);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
