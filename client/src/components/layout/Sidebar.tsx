import { motion } from "framer-motion";
import { useAppStore, type ActiveView } from "../../context/AppContext";
import {
  Lightbulb,
  Pin,
  Users,
  Archive,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "notes", label: "Notes", icon: Lightbulb },
  { id: "pinned", label: "Pinned", icon: Pin },
  { id: "shared", label: "Shared", icon: Users },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export default function Sidebar() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 280 : 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed",
        top: "var(--topbar-height)",
        left: 0,
        bottom: 0,
        background: "var(--bg-sidebar)",
        overflow: "hidden",
        zIndex: 50,
        paddingTop: 8,
      }}
    >
      <motion.ul style={{ listStyle: "none", padding: 0 }}>
        {navItems.map((item, i) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <button
                onClick={() => setActiveView(item.id)}
                aria-label={item.label}
                style={{
                  width: "100%",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "0 24px",
                  borderRadius: "0 24px 24px 0",
                  fontSize: "var(--text-base)",
                  fontWeight: 500,
                  color: isActive
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                  background: isActive
                    ? "var(--bg-active-nav)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                  transition: "background 0.12s, color 0.12s",
                  cursor: "pointer",
                  position: "relative",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.aside>
  );
}
