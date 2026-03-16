import { statusBadgeStyle } from "@/lib/utils";

export function StatusBadge({
  color,
  label,
}: {
  color: string;
  label: string;
  bucket?: string;
}) {
  return (
    <span
      className="inline-flex items-center border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]"
      style={statusBadgeStyle(color)}
    >
      {label}
    </span>
  );
}
