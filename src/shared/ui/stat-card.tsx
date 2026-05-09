interface StatCardProps {
  label: string;
  value: string;
  note: string;
  inverse?: boolean;
}

export function StatCard({ label, value, note, inverse = false }: StatCardProps) {
  return (
    <div
      className={[
        "rounded-3xl border p-5",
        inverse
          ? "border-white/10 bg-white/8 text-white"
          : "surface-card border-line text-[#16120f]",
      ].join(" ")}
    >
      <p className={inverse ? "text-xs tracking-[0.2em] text-white/60 uppercase" : "text-xs tracking-[0.2em] text-[#6f675d] uppercase"}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className={inverse ? "mt-2 text-sm text-white/72" : "mt-2 text-sm text-[#6f675d]"}>
        {note}
      </p>
    </div>
  );
}
