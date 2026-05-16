export default function SkeletonCard() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading notes"
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-card)",
        padding: 16,
        marginBottom: 12,
        breakInside: "avoid" as const,
      }}
    >
      <div
        className="skeleton"
        style={{ height: 16, width: "70%", marginBottom: 12 }}
      />
      <div
        className="skeleton"
        style={{ height: 12, width: "100%", marginBottom: 8 }}
      />
      <div
        className="skeleton"
        style={{ height: 12, width: "90%", marginBottom: 8 }}
      />
      <div className="skeleton" style={{ height: 12, width: "60%" }} />
    </div>
  );
}
