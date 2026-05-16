import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { X } from "lucide-react";

export default function NoteModal() {
  const expandedNote = useAppStore((s) => s.expandedNote);
  const setExpandedNote = useAppStore((s) => s.setExpandedNote);
  const updateNote = useAppStore((s) => s.updateNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when note changes
  useEffect(() => {
    if (expandedNote) {
      setTitle(expandedNote.title);
      setContent(expandedNote.content);
      dirtyRef.current = false;
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

  // Debounced auto-save
  const debounceSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!expandedNote) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNote(expandedNote.id, {
          title: newTitle,
          content: newContent,
        });
        dirtyRef.current = false;
      }, 800);
    },
    [expandedNote, updateNote]
  );

  function handleTitleChange(val: string) {
    setTitle(val);
    dirtyRef.current = true;
    debounceSave(val, content);
  }

  function handleContentChange(val: string) {
    setContent(val);
    dirtyRef.current = true;
    debounceSave(title, val);
  }

  function handleClose() {
    clearTimeout(debounceRef.current);
    if (dirtyRef.current && expandedNote) {
      updateNote(expandedNote.id, { title, content });
    }
    setExpandedNote(null);
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
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
            onClick={handleClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--bg-overlay)",
              zIndex: 500,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90vw",
              maxWidth: 560,
              maxHeight: "80vh",
              overflowY: "auto",
              background: "var(--bg-modal)",
              borderRadius: "var(--radius-modal)",
              boxShadow: "var(--shadow-modal)",
              zIndex: 501,
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
                onChange={(e) => handleTitleChange(e.target.value)}
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
                onClick={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Content */}
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Take a note..."
              style={{
                flex: 1,
                minHeight: 120,
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
              <button
                onClick={handleClose}
                style={{
                  padding: "6px 20px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255,255,255,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
