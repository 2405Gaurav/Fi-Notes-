import { useEffect } from "react";
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

  // Fetch notes on login
  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

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
