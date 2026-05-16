import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import NoteCard from "./NoteCard";
import ShareModal from "./ShareModal";
import EmptyState from "../ui/EmptyState";
import SkeletonCard from "../ui/SkeletonCard";
import type { Note } from "../../api/notesApi";
import {
  Lightbulb,
  Users,
  Pin,
  Archive,
  Trash2,
  Search,
} from "lucide-react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** View config for heading and empty state */
const viewConfig: Record<
  string,
  { title: string; icon: typeof Lightbulb; emptyTitle: string; emptySubtitle: string }
> = {
  notes: {
    title: "Notes",
    icon: Lightbulb,
    emptyTitle: "Your notes appear here",
    emptySubtitle: "Notes you add appear here.",
  },
  shared: {
    title: "Shared with me",
    icon: Users,
    emptyTitle: "No shared notes",
    emptySubtitle: "Notes shared with you will appear here.",
  },
  pinned: {
    title: "Pinned",
    icon: Pin,
    emptyTitle: "No pinned notes",
    emptySubtitle: "Pin important notes to find them here.",
  },
  archive: {
    title: "Archive",
    icon: Archive,
    emptyTitle: "No archived notes",
    emptySubtitle: "Archived notes will appear here.",
  },
  trash: {
    title: "Trash",
    icon: Trash2,
    emptyTitle: "Trash is empty",
    emptySubtitle: "Deleted notes will appear here.",
  },
};

export default function NotesGrid() {
  const notes = useAppStore((s) => s.notes);
  const activeView = useAppStore((s) => s.activeView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const notesLoading = useAppStore((s) => s.notesLoading);
  const [shareTarget, setShareTarget] = useState<Note | null>(null);

  const isSearching = searchQuery.trim().length > 0;

  // Filter notes based on view + search
  const filtered = useMemo(() => {
    let result = notes;
    const q = searchQuery.toLowerCase().trim();

    // Apply search across all notes
    if (isSearching) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
      return result;
    }

    // Apply view filter
    switch (activeView) {
      case "notes":
        // Non-archived, non-deleted (backend already filters deleted)
        result = result.filter((n) => !n.isArchived);
        break;
      case "shared":
        // Notes not owned by me (meaning they were shared with me)
        // Since backend returns both owned + shared, and we don't have ownerId = currentUser mapping,
        // we'll infer: if we don't know the user's ID, we just show all (server handles access)
        // For a proper implementation we'd compare ownerId, but we only have email.
        // Show all non-archived for now; shared badge shows on cards where ownerId !== user
        result = result.filter((n) => !n.isArchived);
        break;
      case "pinned":
        result = result.filter((n) => n.isPinned && !n.isArchived);
        break;
      case "archive":
        result = result.filter((n) => n.isArchived);
        break;
      case "trash":
        // Trash is handled server-side via soft delete
        result = [];
        break;
    }

    return result;
  }, [notes, activeView, searchQuery, isSearching]);

  // For "notes" view: split pinned vs others
  const pinned = useMemo(
    () =>
      activeView === "notes" && !isSearching
        ? filtered.filter((n) => n.isPinned)
        : [],
    [filtered, activeView, isSearching]
  );
  const others = useMemo(
    () =>
      activeView === "notes" && !isSearching
        ? filtered.filter((n) => !n.isPinned)
        : filtered,
    [filtered, activeView, isSearching]
  );

  const config = viewConfig[activeView] || viewConfig.notes;

  return (
    <>
      {/* Section heading */}
      {isSearching ? (
        <motion.div
          key="search-heading"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: "0 16px 16px",
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          <Search
            size={13}
            style={{ marginRight: 6, verticalAlign: "middle" }}
          />
          Search results for: "{searchQuery}"
        </motion.div>
      ) : null}

      {/* Loading skeletons */}
      {notesLoading && (
        <div className="notes-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!notesLoading && filtered.length === 0 && (
        <EmptyState
          icon={isSearching ? Search : config.icon}
          title={
            isSearching
              ? "No notes match your search"
              : config.emptyTitle
          }
          subtitle={
            isSearching ? undefined : config.emptySubtitle
          }
        />
      )}

      {/* Notes grid */}
      {!notesLoading && filtered.length > 0 && (
        <>
          {/* Pinned section */}
          {pinned.length > 0 && (
            <>
              <div
                style={{
                  padding: "0 16px 8px",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Pinned
              </div>
              <motion.div
                className="notes-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence>
                  {pinned.map((note) => (
                    <motion.div key={note.id} variants={childVariants}>
                      <NoteCard note={note} onShare={setShareTarget} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {others.length > 0 && (
                <div
                  style={{
                    padding: "20px 16px 8px",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Others
                </div>
              )}
            </>
          )}

          {/* Other notes */}
          <motion.div
            className="notes-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {others.map((note) => (
                <motion.div key={note.id} variants={childVariants}>
                  <NoteCard note={note} onShare={setShareTarget} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Share Modal */}
      <ShareModal
        note={shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </>
  );
}
