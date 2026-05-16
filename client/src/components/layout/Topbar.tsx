import { useAppStore } from "../../context/AppContext";
import { Menu, Search, X, LogOut } from "lucide-react";
import { useRef, useState } from "react";

export default function Topbar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--topbar-height)",
        background: "var(--bg-app)",
        borderBottom: "1px solid #3c3f41",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 16,
        zIndex: 100,
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <Menu size={22} color="var(--text-secondary)" />
      </button>

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            color: "#202124",
          }}
        >
          F
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          Fi Notes
        </span>
      </div>

      {/* Search Bar */}
      <div
        style={{
          flex: 1,
          maxWidth: 700,
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 46,
            background: "var(--bg-input)",
            borderRadius: "var(--radius-input)",
            padding: "0 14px",
            gap: 10,
            transition: "background 0.15s",
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <Search size={18} color="var(--text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              height: "100%",
              fontSize: "var(--text-base)",
              color: "var(--text-primary)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              style={{
                display: "flex",
                padding: 4,
                borderRadius: "50%",
              }}
            >
              <X size={16} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="User menu"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#202124",
            fontWeight: 600,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initial}
        </button>

        {dropdownOpen && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
              }}
              onClick={() => setDropdownOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 44,
                background: "var(--bg-card)",
                borderRadius: "var(--radius-input)",
                boxShadow: "var(--shadow-modal)",
                padding: "6px 0",
                minWidth: 180,
                zIndex: 201,
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  borderBottom: "1px solid #3c3f41",
                }}
              >
                {user?.email}
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 16px",
                  fontSize: "var(--text-sm)",
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
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
