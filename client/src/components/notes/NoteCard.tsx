import { motion } from "framer-motion";
import { useState } from "react";
import { useAppStore } from "../../context/AppContext";
import type { Note } from "../../api/notesApi";
import { Pin, Archive, Trash2, Users } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onShare: (note: Note) => void;
  readOnly?: boolean;
}

export default function NoteCard({ note, onShare, readOnly }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);
  const setExpandedNote = useAppStore((s) => s.setExpandedNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const user = useAppStore((s) => s.user);

  const isOwner = user && note.ownerId === user.email; // Approximate check — server enforces
  const isShared = !isOwner; // If not owner, it's a shared note

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Note: ${note.title || "Untitled"}`}
      onKeyDown={(e) => {
        if (e.key === "Enter") setExpandedNote(note);
      }}
      onClick={() => setExpandedNote(note)}
      style={{
        background: hovered ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: `1px solid ${hovered ? "var(--border-card)" : "transparent"}`,
        borderRadius: "var(--radius-card)",
        padding: 16,
        cursor: "pointer",
        transition: "background 0.12s, border-color 0.12s",
        position: "relative",
      }}
    >
      {/* Pin indicator */}
      {note.isPinned && (
        <Pin
          size={14}
          fill="var(--color-pinned)"
          color="var(--color-pinned)"
          style={{ position: "absolute", top: 12, right: 12 }}
        />
      )}

      {/* Title */}
      {note.title && (
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 8,
            paddingRight: note.isPinned ? 24 : 0,
            lineHeight: 1.35,
          }}
        >
          {note.title}
        </h3>
      )}

      {/* Content preview */}
      {note.content && (
        <p
          className="note-content"
          style={{
            color: "var(--text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 10,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.55,
          }}
        >
          {note.content}
        </p>
      )}

      {/* Shared badge */}
      {isShared && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginTop: 10,
            padding: "3px 10px",
            borderRadius: 12,
            background: "rgba(129,201,149,0.15)",
            color: "var(--color-shared)",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
          }}
        >
          <Users size={11} />
          Shared
        </div>
      )}

      {/* Action Bar */}
      <motion.div
        initial={false}
        animate={{
          opacity: hovered ? 1 : 0,
          y: hovered ? 0 : 4,
        }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 10,
          paddingTop: 8,
          borderTop: hovered ? "1px solid #3c3f41" : "1px solid transparent",
        }}
      >
        {!readOnly && (
          <>
            <ActionBtn
              icon={<Pin size={16} fill={note.isPinned ? "var(--color-pinned)" : "none"} color={note.isPinned ? "var(--color-pinned)" : "var(--text-secondary)"} />}
              label={note.isPinned ? "Unpin" : "Pin"}
              onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
            />
            <ActionBtn
              icon={<Archive size={16} color="var(--text-secondary)" />}
              label="Archive"
              onClick={() =>
                updateNote(note.id, { isArchived: !note.isArchived })
              }
            />
            <ActionBtn
              icon={<Trash2 size={16} color="var(--text-secondary)" />}
              label="Delete"
              onClick={() => deleteNote(note.id)}
            />
          </>
        )}
        <ActionBtn
          icon={<Users size={16} color="var(--text-secondary)" />}
          label="Share"
          onClick={() => onShare(note)}
        />
      </motion.div>
    </motion.div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
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
        (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {icon}
    </button>
  );
}
