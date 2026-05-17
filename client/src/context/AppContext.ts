import { create } from "zustand";
import type { Note, PaginationMeta } from "../api/notesApi";
import {
  apiFetchNotes,
  apiCreateNote,
  apiUpdateNote,
  apiDeleteNote,
  apiShareNote,
  apiSearchNotes,
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
  notesMeta: PaginationMeta | null;
  notesLoading: boolean;
  loadingMore: boolean;
  fetchNotes: (page?: number) => Promise<void>;
  loadMoreNotes: () => Promise<void>;
  addNote: (title: string, content: string) => Promise<void>;
  updateNote: (
    id: string,
    data: Partial<Pick<Note, "title" | "content" | "isPinned" | "isArchived">>
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  shareNote: (noteId: string, email: string, permission?: "READ" | "EDIT") => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Note[];
  searchMeta: PaginationMeta | null;
  searchLoading: boolean;
  searchLoadingMore: boolean;
  executeSearch: (q: string, page?: number) => Promise<void>;
  loadMoreSearch: () => Promise<void>;

  // UI
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
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
    set({
      user: null,
      notes: [],
      notesMeta: null,
      searchResults: [],
      searchMeta: null,
      searchQuery: "",
      activeView: "notes",
    });
  },

  // ── Notes ──
  notes: [],
  notesMeta: null,
  notesLoading: false,
  loadingMore: false,

  fetchNotes: async (page = 1) => {
    const { user } = get();
    if (!user) return;

    if (page === 1) set({ notesLoading: true });
    else set({ loadingMore: true });

    try {
      const result = await apiFetchNotes(user.token, page);

      if (page === 1) {
        set({ notes: result.notes, notesMeta: result.meta, notesLoading: false });
      } else {
        // Append new notes (deduplicate by id)
        set((s) => {
          const existingIds = new Set(s.notes.map((n) => n.id));
          const newNotes = result.notes.filter((n) => !existingIds.has(n.id));
          return {
            notes: [...s.notes, ...newNotes],
            notesMeta: result.meta,
            loadingMore: false,
          };
        });
      }
    } catch {
      set({ notesLoading: false, loadingMore: false });
      get().addToast("Failed to load notes", "error");
    }
  },

  loadMoreNotes: async () => {
    const { notesMeta, loadingMore } = get();
    if (loadingMore || !notesMeta) return;
    if (notesMeta.page >= notesMeta.totalPages) return; // No more pages
    await get().fetchNotes(notesMeta.page + 1);
  },

  addNote: async (title, content) => {
    const { user } = get();
    if (!user) return;
    try {
      const note = await apiCreateNote(user.token, { title, content });
      set((s) => ({
        notes: [note, ...s.notes],
        notesMeta: s.notesMeta
          ? { ...s.notesMeta, total: s.notesMeta.total + 1 }
          : null,
      }));
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
        // Also update search results if present
        searchResults: s.searchResults.map((n) =>
          n.id === id ? updated : n
        ),
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
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== id),
        searchResults: s.searchResults.filter((n) => n.id !== id),
        notesMeta: s.notesMeta
          ? { ...s.notesMeta, total: Math.max(0, s.notesMeta.total - 1) }
          : null,
      }));
      get().addToast("Note moved to trash", "info");
    } catch (err) {
      get().addToast(
        err instanceof Error ? err.message : "Failed to delete note",
        "error"
      );
    }
  },

  shareNote: async (noteId, email, permission = "READ") => {
    const { user } = get();
    if (!user) return;
    try {
      await apiShareNote(user.token, noteId, email, permission);
      get().addToast(`Note shared with ${email}`, "success");
    } catch (err) {
      throw err; // Let ShareModal handle the display
    }
  },

  // ── Search ──
  searchQuery: "",
  searchResults: [],
  searchMeta: null,
  searchLoading: false,
  searchLoadingMore: false,

  setSearchQuery: (q) => {
    set({ searchQuery: q });
    // Trigger search with debounce handled in App.tsx
    if (!q.trim()) {
      set({ searchResults: [], searchMeta: null });
    }
  },

  executeSearch: async (q, page = 1) => {
    const { user } = get();
    if (!user || !q.trim()) return;

    if (page === 1) set({ searchLoading: true, searchResults: [] });
    else set({ searchLoadingMore: true });

    try {
      const result = await apiSearchNotes(user.token, q, page);

      if (page === 1) {
        set({
          searchResults: result.notes,
          searchMeta: result.meta,
          searchLoading: false,
        });
      } else {
        set((s) => {
          const existingIds = new Set(s.searchResults.map((n) => n.id));
          const newNotes = result.notes.filter((n) => !existingIds.has(n.id));
          return {
            searchResults: [...s.searchResults, ...newNotes],
            searchMeta: result.meta,
            searchLoadingMore: false,
          };
        });
      }
    } catch {
      set({ searchLoading: false, searchLoadingMore: false });
      get().addToast("Search failed", "error");
    }
  },

  loadMoreSearch: async () => {
    const { searchMeta, searchLoadingMore, searchQuery } = get();
    if (searchLoadingMore || !searchMeta) return;
    if (searchMeta.page >= searchMeta.totalPages) return;
    await get().executeSearch(searchQuery, searchMeta.page + 1);
  },

  // ── UI ──
  activeView: "notes",
  setActiveView: (view) => set({ activeView: view, searchQuery: "", searchResults: [], searchMeta: null }),
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
