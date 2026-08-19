import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "text";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-field)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-disabled disabled:text-white",
  secondary:
    "border border-border-subtle bg-card text-foreground hover:bg-surface disabled:text-disabled disabled:hover:bg-card",
  text: "text-primary hover:underline disabled:text-disabled disabled:no-underline",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: {
  variant?: Variant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      // A loading button stays disabled so a double-click can't fire twice.
      disabled={disabled || loading}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-4 animate-spin"
          fill="none"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <path
            d="M14 8a6 6 0 0 0-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
