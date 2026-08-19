import type { ReactNode } from "react";

type Tone = "success" | "warning" | "error" | "info";

/**
 * Every alert pairs its color with an icon and text, never color alone —
 * 04-UIUX-Design-Brief.md section 8 (colorblind accessibility).
 */
const TONES: Record<Tone, { wrapper: string; icon: string; path: string }> = {
  success: {
    wrapper: "border-success/30 bg-success/10",
    icon: "text-success",
    path: "M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0Z",
  },
  warning: {
    wrapper: "border-warning/30 bg-warning/10",
    icon: "text-warning",
    path: "M8.5 3.3a1.7 1.7 0 0 1 3 0l5.4 9.9a1.7 1.7 0 0 1-1.5 2.5H4.6a1.7 1.7 0 0 1-1.5-2.5l5.4-9.9ZM10 7a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  },
  error: {
    wrapper: "border-error/30 bg-error/10",
    icon: "text-error",
    path: "M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-9-4a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V6Zm1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  },
  info: {
    wrapper: "border-info/30 bg-info/10",
    icon: "text-info",
    path: "M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-9 4a1 1 0 1 0 2 0v-4a1 1 0 1 0-2 0v4Zm1-8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  },
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const style = TONES[tone];

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-[var(--radius-field)] border px-3.5 py-3 ${style.wrapper}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`mt-0.5 size-4 shrink-0 ${style.icon}`}
      >
        <path fillRule="evenodd" d={style.path} clipRule="evenodd" />
      </svg>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
