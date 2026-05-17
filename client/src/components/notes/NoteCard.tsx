import { motion } from "framer-motion";
import { useState } from "react";
import { useAppStore } from "../../context/AppContext";
import type { Note } from "../../api/notesApi";
import { Pin, Archive, Trash2, Users, Eye, Pencil, RotateCcw, Trash } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onShare: (note: Note) => void;
  isTrash?: boolean;
}

export default function NoteCard({ note, onShare, isTrash }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);
  const setExpandedNote = useAppStore((s) => s.setExpandedNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const restoreNote = useAppStore((s) => s.restoreNote);
  const permanentDeleteNote = useAppStore((s) => s.permanentDeleteNote);

  const isOwner = note.permission === "OWNER";
  const isShared = !isOwner;

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
        if (e.key === "Enter" && !isTrash) setExpandedNote(note);
      }}
      onClick={() => {
        if (!isTrash) setExpandedNote(note);
      }}
      style={{
        background: hovered ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: `1px solid ${hovered ? "var(--border-card)" : "transparent"}`,
        borderRadius: "var(--radius-card)",
        padding: 16,
        cursor: isTrash ? "default" : "pointer",
        transition: "background 0.12s, border-color 0.12s",
        position: "relative",
        opacity: isTrash ? 0.75 : 1,
      }}
    >
      {/* Pin indicator (not in trash) */}
      {!isTrash && note.isPinned && (
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
            paddingRight: !isTrash && note.isPinned ? 24 : 0,
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
            WebkitLineClamp: isTrash ? 4 : 10,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.55,
          }}
        >
          {note.content}
        </p>
      )}

      {/* Sharing badges (not in trash) */}
      {!isTrash && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {isShared && note.sharedBy && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 12,
                background: "rgba(129,201,149,0.15)",
                color: "var(--color-shared)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
              }}
            >
              <Users size={11} />
              Shared by {note.sharedBy.name || note.sharedBy.email}
            </div>
          )}

          {isShared && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 12,
                background:
                  note.permission === "EDIT"
                    ? "rgba(254,185,0,0.12)"
                    : "rgba(138,180,248,0.12)",
                color:
                  note.permission === "EDIT"
                    ? "var(--color-pinned)"
                    : "var(--border-focus)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
              }}
            >
              {note.permission === "EDIT" ? (
                <Pencil size={10} />
              ) : (
                <Eye size={10} />
              )}
              {note.permission === "EDIT" ? "Can edit" : "View only"}
            </div>
          )}

          {isOwner && note.sharedWith.length > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 12,
                background: "rgba(129,201,149,0.15)",
                color: "var(--color-shared)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
              }}
            >
              <Users size={11} />
              Shared with {note.sharedWith.length}
            </div>
          )}
        </div>
      )}

      {/* Trash badge */}
      {isTrash && note.updatedAt && (
        <div
          style={{
            marginTop: 10,
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          Deleted {new Date(note.updatedAt).toLocaleDateString()}
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
        {isTrash ? (
          /* ── Trash view: Restore + Permanent Delete ── */
          <>
            <ActionBtn
              icon={<RotateCcw size={16} color="var(--color-shared)" />}
              label="Restore"
              onClick={() => restoreNote(note.id)}
            />
            <ActionBtn
              icon={<Trash size={16} color="var(--color-danger)" />}
              label="Delete forever"
              onClick={() => {
                if (window.confirm("Permanently delete this note? This cannot be undone.")) {
                  permanentDeleteNote(note.id);
                }
              }}
            />
          </>
        ) : (
          /* ── Normal view ── */
          <>
            {isOwner && (
              <>
                <ActionBtn
                  icon={
                    <Pin
                      size={16}
                      fill={note.isPinned ? "var(--color-pinned)" : "none"}
                      color={
                        note.isPinned
                          ? "var(--color-pinned)"
                          : "var(--text-secondary)"
                      }
                    />
                  }
                  label={note.isPinned ? "Unpin" : "Pin"}
                  onClick={() =>
                    updateNote(note.id, { isPinned: !note.isPinned })
                  }
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
                <ActionBtn
                  icon={<Users size={16} color="var(--text-secondary)" />}
                  label="Share"
                  onClick={() => onShare(note)}
                />
              </>
            )}
          </>
        )}
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
