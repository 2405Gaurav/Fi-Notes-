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
  Loader2,
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
  const loadingMore = useAppStore((s) => s.loadingMore);
  const notesMeta = useAppStore((s) => s.notesMeta);
  const loadMoreNotes = useAppStore((s) => s.loadMoreNotes);

  // Search state
  const searchResults = useAppStore((s) => s.searchResults);
  const searchMeta = useAppStore((s) => s.searchMeta);
  const searchLoading = useAppStore((s) => s.searchLoading);
  const searchLoadingMore = useAppStore((s) => s.searchLoadingMore);
  const loadMoreSearch = useAppStore((s) => s.loadMoreSearch);

  const [shareTarget, setShareTarget] = useState<Note | null>(null);

  // Trash state
  const trashNotes = useAppStore((s) => s.trashNotes);
  const trashMeta = useAppStore((s) => s.trashMeta);
  const trashLoading = useAppStore((s) => s.trashLoading);
  const trashLoadingMore = useAppStore((s) => s.trashLoadingMore);
  const loadMoreTrash = useAppStore((s) => s.loadMoreTrash);

  const isSearching = searchQuery.trim().length > 0;
  const isTrashView = activeView === "trash";

  // Filter notes based on view (when not searching)
  const filtered = useMemo(() => {
    if (isSearching) return []; // Not used during search

    let result = notes;

    switch (activeView) {
      case "notes":
        result = result.filter((n) => !n.isArchived);
        break;
      case "shared":
        result = result.filter((n) => !n.isArchived);
        break;
      case "pinned":
        result = result.filter((n) => n.isPinned && !n.isArchived);
        break;
      case "archive":
        result = result.filter((n) => n.isArchived);
        break;
      case "trash":
        result = [];
        break;
    }

    return result;
  }, [notes, activeView, isSearching]);

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

  // The data to render — depends on view
  const displayNotes = isTrashView
    ? trashNotes
    : isSearching
      ? searchResults
      : others;
  const isLoading = isTrashView
    ? trashLoading
    : isSearching
      ? searchLoading
      : notesLoading;
  const isLoadingMore = isTrashView
    ? trashLoadingMore
    : isSearching
      ? searchLoadingMore
      : loadingMore;
  const meta = isTrashView
    ? trashMeta
    : isSearching
      ? searchMeta
      : notesMeta;
  const hasMore = meta ? meta.page < meta.totalPages : false;
  const handleLoadMore = isTrashView
    ? loadMoreTrash
    : isSearching
      ? loadMoreSearch
      : loadMoreNotes;

  return (
    <>
      {/* Search heading */}
      {isSearching && !searchLoading && searchMeta && (
        <motion.div
          key="search-heading"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: "0 16px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
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
            {searchMeta.total} result{searchMeta.total !== 1 ? "s" : ""} for "
            {searchQuery}"
          </span>
        </motion.div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="notes-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (
        isTrashView
          ? trashNotes.length === 0 && !trashLoading && (
              <EmptyState icon={config.icon} title={config.emptyTitle} subtitle={config.emptySubtitle} />
            )
          : (isSearching ? searchResults.length === 0 && searchMeta : filtered.length === 0) && (
              <EmptyState
                icon={isSearching ? Search : config.icon}
                title={isSearching ? "No notes match your search" : config.emptyTitle}
                subtitle={isSearching ? undefined : config.emptySubtitle}
              />
            )
      )}

      {/* Notes grid */}
      {!isLoading && (
        <>
          {/* Pinned section (only for notes view, not searching) */}
          {pinned.length > 0 && !isSearching && (
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

          {/* Main notes list */}
          {displayNotes.length > 0 && (
            <motion.div
              className="notes-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {displayNotes.map((note) => (
                  <motion.div key={note.id} variants={childVariants}>
                    <NoteCard note={note} onShare={setShareTarget} isTrash={isTrashView} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Load More button */}
          {hasMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "24px 0",
              }}
            >
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 28px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-card)",
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: isLoadingMore ? "not-allowed" : "pointer",
                  opacity: isLoadingMore ? 0.6 : 1,
                  transition: "background 0.12s, opacity 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isLoadingMore)
                    e.currentTarget.style.background = "var(--bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-card)";
                }}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 0.7s linear infinite" }}
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    Load more
                    {meta && (
                      <span style={{ color: "var(--text-muted)" }}>
                        ({meta.page * meta.limit} of {meta.total})
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Pagination info */}
          {meta && meta.total > 0 && !hasMore && displayNotes.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
              }}
            >
              Showing all {meta.total} note{meta.total !== 1 ? "s" : ""}
            </div>
          )}
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
