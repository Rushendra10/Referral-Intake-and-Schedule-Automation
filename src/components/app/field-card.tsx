export function FieldCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-2 text-sm ${value ? "text-white" : "text-amber-300"}`}>
        {value || "Missing / incomplete"}
      </div>
    </div>
  );
}
