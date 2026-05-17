import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { X, Check, Eye, Pencil } from "lucide-react";
import type { Note } from "../../api/notesApi";

interface ShareModalProps {
  note: Note | null;
  onClose: () => void;
}

export default function ShareModal({ note, onClose }: ShareModalProps) {
  const shareNote = useAppStore((s) => s.shareNote);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"READ" | "EDIT">("READ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Simple email format check
  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  async function handleShare() {
    if (!note || !email.trim()) return;

    // Client-side format check
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email for sharing");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await shareNote(note.id, email.trim(), permission);
      const permLabel = permission === "EDIT" ? "edit" : "view";
      setSuccess(`Shared with ${email.trim()} (can ${permLabel})`);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setEmail("");
    setPermission("READ");
    setError("");
    setSuccess("");
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

          {/* Centered container */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 601,
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
                maxWidth: 420,
                background: "var(--bg-modal)",
                borderRadius: "var(--radius-modal)",
                boxShadow: "var(--shadow-modal)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px 14px",
                }}
              >
                <h2
                  style={{
                    fontSize: 17,
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
                  <X size={16} color="var(--text-secondary)" />
                </button>
              </div>

              {/* Email input */}
              <div style={{ padding: "0 20px" }}>
                <input
                  type="email"
                  placeholder="Enter the email you want to share with"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleShare();
                    }
                  }}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
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
              </div>

              {/* Permission selector */}
              <div style={{ padding: "12px 20px 0" }}>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  Permission
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <PermissionOption
                    active={permission === "READ"}
                    icon={<Eye size={14} />}
                    label="View only"
                    onClick={() => setPermission("READ")}
                  />
                  <PermissionOption
                    active={permission === "EDIT"}
                    icon={<Pencil size={14} />}
                    label="Can edit"
                    onClick={() => setPermission("EDIT")}
                  />
                </div>
              </div>

              {/* Error / Success */}
              <div style={{ padding: "0 20px 16px" }}>
                {error && (
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-danger)",
                      marginTop: 10,
                    }}
                  >
                    {error}
                  </p>
                )}

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 10,
                        color: "var(--color-shared)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      <Check size={15} />
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer — Cancel / Share */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "12px 20px",
                  borderTop: "1px solid #3c3f41",
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    padding: "8px 20px",
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
                  onClick={handleShare}
                  disabled={!email.trim() || loading}
                  style={{
                    padding: "8px 22px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    background: "var(--accent)",
                    color: "#202124",
                    opacity: !email.trim() || loading ? 0.4 : 1,
                    cursor:
                      !email.trim() || loading ? "not-allowed" : "pointer",
                    transition: "opacity 0.15s",
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
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Permission toggle button ───────────────

function PermissionOption({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "9px 0",
        borderRadius: "var(--radius-input)",
        border: `1.5px solid ${active ? "var(--accent)" : "var(--border-input)"}`,
        background: active ? "rgba(254,185,0,0.08)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
