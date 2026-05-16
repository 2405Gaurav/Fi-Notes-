import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../context/AppContext";
import { apiLogin, apiRegister } from "../../api/notesApi";

type AuthMode = "login" | "signup";

export default function AuthGate() {
  const login = useAppStore((s) => s.login);
  const addToast = useAppStore((s) => s.addToast);

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        await apiRegister(name.trim(), email.trim(), password);
        addToast("Account created! Please log in.", "success");
        setMode("login");
        setPassword("");
      } else {
        const data = await apiLogin(email.trim(), password);
        login(email.trim(), data.access_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-app)",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 400,
          padding: 40,
          borderRadius: 16,
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#202124",
            }}
          >
            F
          </div>
          <span
            style={{
              fontSize: "var(--text-2xl)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Fi Notes
          </span>
        </div>

        {/* Form — animate between modes */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleSubmit}
          >
            {/* Name (signup only) */}
            {mode === "signup" && (
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={(e) => applyFocus(e.currentTarget)}
                  onBlur={(e) => removeFocus(e.currentTarget)}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => applyFocus(e.currentTarget)}
                onBlur={(e) => removeFocus(e.currentTarget)}
              />
            </div>

            <div style={{ marginBottom: 6 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
                onFocus={(e) => applyFocus(e.currentTarget)}
                onBlur={(e) => removeFocus(e.currentTarget)}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  color: "var(--color-danger)",
                  fontSize: "var(--text-sm)",
                  marginTop: 6,
                  marginBottom: 6,
                }}
              >
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: 44,
                marginTop: 18,
                borderRadius: "var(--radius-pill)",
                background: "var(--accent)",
                color: "#202124",
                fontWeight: 600,
                fontSize: "var(--text-base)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                    width: 18,
                    height: 18,
                    border: "2.5px solid #202124",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }}
                />
              ) : mode === "login" ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Toggle */}
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            style={{
              color: "var(--border-focus)",
              fontWeight: 500,
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Shared Styles ──────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: "1px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  background: "var(--bg-input)",
  fontSize: "var(--text-base)",
  color: "var(--text-primary)",
  transition: "border-color 0.15s, box-shadow 0.15s",
  outline: "none",
};

function applyFocus(el: HTMLElement) {
  el.style.borderColor = "var(--border-focus)";
  el.style.boxShadow = "0 0 0 2px rgba(138,180,248,0.2)";
}
function removeFocus(el: HTMLElement) {
  el.style.borderColor = "var(--border-input)";
  el.style.boxShadow = "none";
}
