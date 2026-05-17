import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "./context/AppContext";
import AuthGate from "./components/auth/AuthGate";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import NoteComposer from "./components/notes/NoteComposer";
import NotesGrid from "./components/notes/NotesGrid";
import NoteModal from "./components/notes/NoteModal";
import Toast from "./components/ui/Toast";

export default function App() {
  const user = useAppStore((s) => s.user);
  const fetchNotes = useAppStore((s) => s.fetchNotes);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const executeSearch = useAppStore((s) => s.executeSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch notes on login
  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  // Debounced search — 400ms after typing stops
  const debouncedSearch = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      if (!q.trim()) return;
      debounceRef.current = setTimeout(() => {
        executeSearch(q.trim());
      }, 400);
    },
    [executeSearch]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, debouncedSearch]);

  // Not logged in → show auth
  if (!user) {
    return (
      <>
        <AuthGate />
        <Toast />
      </>
    );
  }

  // Logged in → app shell
  return (
    <>
      <Topbar />
      <Sidebar />

      <motion.main
        animate={{
          marginLeft: sidebarOpen ? 280 : 0,
        }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{
          marginTop: "var(--topbar-height)",
          padding: "28px 16px",
          minHeight: "calc(100vh - var(--topbar-height))",
        }}
      >
        {/* Hide composer when searching */}
        {!searchQuery && <NoteComposer />}

        <NotesGrid />
      </motion.main>

      <NoteModal />
      <Toast />
    </>
  );
}
