import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import VersionHistory from "./VersionHistory";
import { X, Eye, History } from "lucide-react";

export default function NoteModal() {
  const expandedNote = useAppStore((s) => s.expandedNote);
  const setExpandedNote = useAppStore((s) => s.setExpandedNote);
  const updateNote = useAppStore((s) => s.updateNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Permission checks
  const canEdit =
    expandedNote?.permission === "OWNER" ||
    expandedNote?.permission === "EDIT";
  const isReadOnly = expandedNote?.permission === "READ";

  // Sync local state when note opens
  useEffect(() => {
    if (expandedNote) {
      setTitle(expandedNote.title);
      setContent(expandedNote.content);
      setShowVersions(false);
    }
  }, [expandedNote]);

  // Auto-grow textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height =
        contentRef.current.scrollHeight + "px";
    }
  }, [content]);

  // Check if content changed
  const isDirty =
    expandedNote &&
    (title !== expandedNote.title || content !== expandedNote.content);

  async function handleSave() {
    if (!expandedNote || !isDirty) return;
    setSaving(true);
    await updateNote(expandedNote.id, { title, content });
    setSaving(false);
    setExpandedNote(null);
  }

  function handleCancel() {
    setExpandedNote(null);
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showVersions) {
          setShowVersions(false);
        } else {
          handleCancel();
        }
      }
    }
    if (expandedNote) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const formattedDate = expandedNote
    ? new Date(expandedNote.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <>
      <AnimatePresence>
        {expandedNote && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCancel}
              style={{
                position: "fixed",
                inset: 0,
                background: "var(--bg-overlay)",
                zIndex: 500,
              }}
            />

            {/* Centered modal */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 501,
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
                  maxWidth: 560,
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
                    padding: "16px 20px 0",
                  }}
                >
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    readOnly={isReadOnly}
                    style={{
                      flex: 1,
                      fontSize: "var(--text-xl)",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      cursor: isReadOnly ? "default" : undefined,
                    }}
                  />
                  <button
                    aria-label="Close"
                    onClick={handleCancel}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <X size={18} color="var(--text-secondary)" />
                  </button>
                </div>

                {/* Read-only banner */}
                {isReadOnly && expandedNote?.sharedBy && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 20px",
                      fontSize: "var(--text-xs)",
                      color: "var(--border-focus)",
                    }}
                  >
                    <Eye size={12} />
                    View only · Shared by{" "}
                    {expandedNote.sharedBy.name ||
                      expandedNote.sharedBy.email}
                  </div>
                )}

                {/* Content */}
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Take a note..."
                  readOnly={isReadOnly}
                  style={{
                    flex: 1,
                    minHeight: 100,
                    padding: "12px 20px",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    cursor: isReadOnly ? "default" : undefined,
                  }}
                />

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 20px 12px",
                    borderTop: "1px solid #3c3f41",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Edited {formattedDate}
                    </span>

                    {/* Version history button */}
                    <button
                      onClick={() => setShowVersions(true)}
                      title="Version history"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        borderRadius: 12,
                        border: "1px solid var(--border-input)",
                        background: "transparent",
                        color: "var(--text-muted)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-input)";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <History size={12} />
                      History
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: "7px 20px",
                        borderRadius: "var(--radius-pill)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        transition: "background 0.1s, color 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.06)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {isReadOnly ? "Close" : "Cancel"}
                    </button>
                    {canEdit && (
                      <button
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        style={{
                          padding: "7px 22px",
                          borderRadius: "var(--radius-pill)",
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          background: "var(--accent)",
                          color: "#202124",
                          opacity: !isDirty || saving ? 0.4 : 1,
                          cursor:
                            !isDirty || saving ? "not-allowed" : "pointer",
                          transition: "opacity 0.15s",
                        }}
                      >
                        {saving ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.7,
                              ease: "linear",
                            }}
                            style={{
                              display: "inline-block",
                              width: 14,
                              height: 14,
                              border: "2px solid #202124",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          "Save"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Version History Modal */}
      <VersionHistory
        noteId={showVersions && expandedNote ? expandedNote.id : null}
        onClose={() => setShowVersions(false)}
      />
    </>
  );
}
