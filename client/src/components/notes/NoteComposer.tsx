import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { Pin } from "lucide-react";

export default function NoteComposer() {
  const isOpen = useAppStore((s) => s.isComposerOpen);
  const setOpen = useAppStore((s) => s.setComposerOpen);
  const addNote = useAppStore((s) => s.addNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus title when expanded
  useEffect(() => {
    if (isOpen) titleRef.current?.focus();
  }, [isOpen]);

  // Click-outside to cancel
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleCancel();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  });

  function handleSave() {
    if (title.trim() || content.trim()) {
      addNote(title.trim() || "Untitled", content.trim());
    }
    resetAndClose();
  }

  function handleCancel() {
    resetAndClose();
  }

  function resetAndClose() {
    setTitle("");
    setContent("");
    setOpen(false);
  }

  // Auto-grow textarea
  function autoGrow() {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height =
        contentRef.current.scrollHeight + "px";
    }
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto 28px",
        padding: "0 8px",
      }}
    >
      <div
        ref={containerRef}
        style={{
          border: "1px solid var(--border-card)",
          borderRadius: "var(--radius-input)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        {/* Collapsed */}
        {!isOpen && (
          <div
            onClick={() => setOpen(true)}
            style={{
              height: 46,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              cursor: "text",
              color: "var(--text-secondary)",
              fontSize: "var(--text-base)",
              fontWeight: 500,
            }}
          >
            Take a note...
          </div>
        )}

        {/* Expanded */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* Title row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px 0",
                }}
              >
                <input
                  ref={titleRef}
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                />
                <Pin size={18} color="var(--text-muted)" />
              </div>

              {/* Content area */}
              <textarea
                ref={contentRef}
                placeholder="Take a note..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  autoGrow();
                }}
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: "10px 16px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  lineHeight: 1.55,
                  background: "transparent",
                }}
              />

              {/* Action Buttons — Save + Cancel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.18 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "8px 12px",
                  borderTop: "1px solid #3c3f41",
                }}
              >
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
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
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
                  disabled={!title.trim() && !content.trim()}
                  style={{
                    padding: "7px 22px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    background: "var(--accent)",
                    color: "#202124",
                    opacity: !title.trim() && !content.trim() ? 0.4 : 1,
                    cursor:
                      !title.trim() && !content.trim()
                        ? "not-allowed"
                        : "pointer",
                    transition: "opacity 0.15s",
                  }}
                >
                  Save
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
