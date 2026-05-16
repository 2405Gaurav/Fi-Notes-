import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { X } from "lucide-react";

export default function Toast() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              borderRadius: 8,
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "#fff",
              background:
                t.type === "error"
                  ? "var(--color-danger)"
                  : t.type === "success"
                    ? "var(--color-shared)"
                    : "var(--bg-card-hover)",
              boxShadow: "var(--shadow-card)",
              maxWidth: 340,
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
              style={{
                display: "flex",
                opacity: 0.7,
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
