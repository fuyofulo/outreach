import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="retro-window mb-6 overflow-hidden">
      <div className="retro-titlebar px-4 py-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em]">{eyebrow}</p>
      </div>
      <div className="retro-pattern flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <h1 className="hero-title text-2xl font-black tracking-[-0.08em] text-[#112a63] md:text-4xl">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  title,
  children,
  action,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`retro-window overflow-hidden ${className ?? ""}`.trim()}>
      <div className="retro-titlebar flex items-center justify-between gap-4 px-4 py-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">
          {title}
        </h2>
        {action}
      </div>
      <div className={`retro-pattern p-4 ${bodyClassName ?? ""}`.trim()}>
        {children}
      </div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="retro-window overflow-hidden">
      <div className="bg-[linear-gradient(90deg,#ff4fc7_0%,#ff9de7_100%)] px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
        {label}
      </div>
      <div className="retro-pattern p-3">
        <p className="text-2xl font-black tracking-tight text-[#12306d]">{value}</p>
        {note ? <p className="mt-1 text-xs text-[#40527e]">{note}</p> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="retro-window retro-pattern p-4 text-center">
      <p className="font-[Trebuchet_MS] text-lg font-black text-[#16346f]">{title}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="button-secondary mt-3 inline-flex">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
