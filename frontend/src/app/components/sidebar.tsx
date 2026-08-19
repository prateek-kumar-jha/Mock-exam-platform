"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Icon-only primary navigation per 04-UIUX-Design-Brief.md section 3 — no
 * persistent text labels. Labels are exposed to assistive tech via aria-label
 * and surfaced sighted-users on hover, so the icons are never the only signal.
 *
 * Study Resources is deliberately absent: out of scope for this project.
 */
const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    path: "M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1v-6.5Z",
  },
  {
    href: "/job-alerts",
    label: "Job Alerts",
    path: "M10 2a5 5 0 0 0-5 5v3.6l-1.3 2.3A1 1 0 0 0 4.6 14h10.8a1 1 0 0 0 .9-1.1L15 10.6V7a5 5 0 0 0-5-5Zm0 16a2.5 2.5 0 0 0 2.4-2H7.6A2.5 2.5 0 0 0 10 18Z",
  },
  {
    href: "/profile",
    label: "Profile",
    path: "M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 1.5c-3 0-6 1.5-6 3.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1c0-2-3-3.5-6-3.5Z",
  },
  {
    href: "/settings",
    label: "Settings",
    path: "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 1-.1 1.1l1.5 1.2-1.5 2.6-1.8-.6a7 7 0 0 1-1.9 1.1l-.3 1.9H8.1l-.3-1.9a7 7 0 0 1-1.9-1.1l-1.8.6-1.5-2.6 1.5-1.2A7 7 0 0 1 4 10c0-.4 0-.7.1-1.1L2.6 7.7l1.5-2.6 1.8.6a7 7 0 0 1 1.9-1.1l.3-1.9h2.8l.3 1.9a7 7 0 0 1 1.9 1.1l1.8-.6 1.5 2.6-1.5 1.2c.1.4.1.7.1 1.1Z",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex shrink-0 flex-col items-center gap-2 border-r border-border-subtle bg-card px-2 py-4 sm:px-3"
    >
      <span
        aria-hidden="true"
        className="mb-4 text-lg font-bold text-primary sm:text-xl"
      >
        E<span className="text-accent">S</span>
      </span>

      {NAV.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={`group relative flex size-10 items-center justify-center rounded-[var(--radius-field)] transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-surface hover:text-foreground"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d={item.path} />
            </svg>

            {/* Hover label — icon alone is never the only cue. */}
            <span className="pointer-events-none absolute left-full z-10 ml-2 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background group-hover:block">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
