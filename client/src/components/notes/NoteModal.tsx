import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { X } from "lucide-react";

export default function NoteModal() {
  const expandedNote = useAppStore((s) => s.expandedNote);
  const setExpandedNote = useAppStore((s) => s.setExpandedNote);
  const updateNote = useAppStore((s) => s.updateNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when note opens
  useEffect(() => {
    if (expandedNote) {
      setTitle(expandedNote.title);
      setContent(expandedNote.content);
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
      if (e.key === "Escape") handleCancel();
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
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                pointerEvents: "auto",
                width: "90vw",
                maxWidth: 520,
                maxHeight: "70vh",
                overflowY: "auto",
                background: "var(--bg-modal)",
                borderRadius: "var(--radius-modal)",
                boxShadow: "var(--shadow-modal)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Title */}
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
                  style={{
                    flex: 1,
                    fontSize: "var(--text-xl)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
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

              {/* Content */}
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take a note..."
                style={{
                  flex: 1,
                  minHeight: 100,
                  padding: "12px 20px",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
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
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  Edited {formattedDate}
                </span>

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
                    Cancel
                  </button>
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
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
