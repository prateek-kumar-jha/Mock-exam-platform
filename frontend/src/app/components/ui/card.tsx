import type { ReactNode } from "react";

type TagTone = "success" | "warning" | "error" | "info";

/**
 * Category pills use the palette's status colors rather than arbitrary
 * pastels, per 04-UIUX-Design-Brief.md section 3.
 */
const TAG_TONES: Record<TagTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
};

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    // Soft shadow for depth rather than a heavy border, 20px radius.
    <div
      className={`rounded-[var(--radius-card)] border border-border-subtle bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTag({
  tone = "info",
  children,
}: {
  tone?: TagTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TAG_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-3 text-base font-semibold text-foreground">{children}</h3>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-sm text-text-secondary">{children}</p>;
}

/** Small stat line, e.g. "10 questions · 60 min". */
export function CardStats({ items }: { items: string[] }) {
  return (
    <p className="mt-4 text-xs text-text-secondary">{items.join(" · ")}</p>
  );
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex items-center gap-2">{children}</div>;
}
