import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-primary">
            Edu<span className="text-accent">Spark</span>
          </span>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">{footer}</p>
      </div>
    </main>
  );
}

export function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full rounded-[var(--radius-field)] border border-border-subtle bg-background px-3.5 py-2.5 text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hint ? (
        <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Error banner. Pairs the error color with an icon and text rather than relying
 * on color alone, per the brief's accessibility guidance (section 8).
 */
export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-[var(--radius-field)] border border-error/30 bg-error/10 px-3.5 py-3"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 size-4 shrink-0 text-error"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-9-4a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V6Zm1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}

export function SubmitButton({
  pending,
  idleLabel,
  pendingLabel,
}: {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-[var(--radius-field)] bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-disabled"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
