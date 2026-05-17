import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { apiGetNoteVersions } from "../../api/notesApi";
import type { NoteVersion } from "../../api/notesApi";
import { X, History, ChevronDown, Loader2 } from "lucide-react";

interface VersionHistoryProps {
  noteId: string | null;
  onClose: () => void;
}

export default function VersionHistory({ noteId, onClose }: VersionHistoryProps) {
  const user = useAppStore((s) => s.user);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (noteId && user) {
      setVersions([]);
      setPage(1);
      setError("");
      fetchVersions(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  async function fetchVersions(p: number) {
    if (!noteId || !user) return;

    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await apiGetNoteVersions(user.token, noteId, p);
      if (p === 1) {
        setVersions(result.versions);
      } else {
        setVersions((prev) => [...prev, ...result.versions]);
      }
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load version history"
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleClose() {
    setVersions([]);
    setError("");
    onClose();
  }

  const hasMore = page < totalPages;

  return (
    <AnimatePresence>
      {noteId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--bg-overlay)",
              zIndex: 700,
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 701,
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                pointerEvents: "auto",
                width: "90vw",
                maxWidth: 520,
                maxHeight: "80vh",
                background: "var(--bg-modal)",
                borderRadius: "var(--radius-modal)",
                boxShadow: "var(--shadow-modal)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px 14px",
                  borderBottom: "1px solid #3c3f41",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <History size={18} color="var(--accent)" />
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    Version History
                  </h2>
                  {total > 0 && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                        padding: "2px 8px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 10,
                      }}
                    >
                      {total} version{total !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <X size={16} color="var(--text-secondary)" />
                </button>
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "0 20px",
                }}
              >
                {/* Loading */}
                {loading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "40px 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Loader2
                      size={20}
                      style={{ animation: "spin 0.7s linear infinite" }}
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p
                    style={{
                      padding: "20px 0",
                      color: "var(--color-danger)",
                      fontSize: "var(--text-sm)",
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Empty */}
                {!loading && !error && versions.length === 0 && (
                  <div
                    style={{
                      padding: "40px 0",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <History
                      size={32}
                      style={{ marginBottom: 12, opacity: 0.4 }}
                    />
                    <p>No version history yet</p>
                    <p style={{ fontSize: "var(--text-xs)", marginTop: 4 }}>
                      Versions are created when you edit a note
                    </p>
                  </div>
                )}

                {/* Version list */}
                {versions.map((v, i) => (
                  <div
                    key={v.id}
                    style={{
                      padding: "16px 0",
                      borderBottom:
                        i < versions.length - 1
                          ? "1px solid rgba(255,255,255,0.06)"
                          : "none",
                    }}
                  >
                    {/* Version header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          color: "var(--accent)",
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                        }}
                      >
                        v{v.version}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {v.title}
                    </div>

                    {/* Content preview */}
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-secondary)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5,
                      }}
                    >
                      {v.content}
                    </div>
                  </div>
                ))}

                {/* Load more */}
                {hasMore && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "16px 0",
                    }}
                  >
                    <button
                      onClick={() => fetchVersions(page + 1)}
                      disabled={loadingMore}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 20px",
                        borderRadius: "var(--radius-pill)",
                        border: "1px solid var(--border-card)",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        cursor: loadingMore ? "not-allowed" : "pointer",
                        opacity: loadingMore ? 0.5 : 1,
                      }}
                    >
                      {loadingMore ? (
                        <Loader2
                          size={14}
                          style={{ animation: "spin 0.7s linear infinite" }}
                        />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      Load older versions
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
