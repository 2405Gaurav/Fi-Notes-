import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Lightbulb } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
}

export default function EmptyState({
  icon: Icon = Lightbulb,
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <Icon size={48} color="var(--text-muted)" strokeWidth={1.2} />
      <h3
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "var(--text-muted)",
          marginTop: 16,
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginTop: 6,
          }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
