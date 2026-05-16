import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { X, Check } from "lucide-react";
import type { Note } from "../../api/notesApi";

interface ShareModalProps {
  note: Note | null;
  onClose: () => void;
}

export default function ShareModal({ note, onClose }: ShareModalProps) {
  const shareNote = useAppStore((s) => s.shareNote);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!note || !email.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await shareNote(note.id, email.trim());
      setSharedEmails((prev) => [...prev, email.trim()]);
      setSuccess(true);
      setEmail("");
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setEmail("");
    setError("");
    setSuccess(false);
    setSharedEmails([]);
    onClose();
  }

  return (
    <AnimatePresence>
      {note && (
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
              zIndex: 600,
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
              maxWidth: 380,
              background: "var(--bg-modal)",
              borderRadius: "var(--radius-modal)",
              boxShadow: "var(--shadow-modal)",
              zIndex: 601,
              padding: 24,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Share note
              </h2>
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
                }}
              >
                <X size={18} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleShare}
              style={{ display: "flex", gap: 8, marginBottom: 6 }}
            >
              <input
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                style={{
                  flex: 1,
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${error ? "var(--color-danger)" : "var(--border-input)"}`,
                  borderRadius: "var(--radius-input)",
                  background: "var(--bg-input)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  if (!error)
                    e.currentTarget.style.borderColor =
                      "var(--border-focus)";
                }}
                onBlur={(e) => {
                  if (!error)
                    e.currentTarget.style.borderColor =
                      "var(--border-input)";
                }}
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  height: 40,
                  padding: "0 18px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--accent)",
                  color: "#202124",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  opacity: loading || !email.trim() ? 0.5 : 1,
                  cursor:
                    loading || !email.trim() ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                  flexShrink: 0,
                }}
              >
                {loading ? (
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
                  "Share"
                )}
              </button>
            </form>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-danger)",
                  marginTop: 4,
                  marginBottom: 4,
                }}
              >
                {error}
              </p>
            )}

            {/* Success animation */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--color-shared)",
                    fontSize: "var(--text-sm)",
                    marginTop: 8,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                  >
                    <Check size={16} />
                  </motion.div>
                  Shared successfully
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shared with list */}
            {sharedEmails.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Shared with:
                </p>
                {sharedEmails.map((e) => (
                  <div
                    key={e}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 0",
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--color-shared)",
                        flexShrink: 0,
                      }}
                    />
                    {e}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
