import type { FractionValue } from "@/shared/data/types";

export function FractionDisplay({ value }: { value: FractionValue }) {
  const { numerator, denominator } = value;

  if (denominator === 1) {
    return <span>{numerator}</span>;
  }

  const sign = numerator < 0 ? "-" : "";
  const absoluteNumerator = Math.abs(numerator);
  const whole = Math.trunc(absoluteNumerator / denominator);
  const remainder = absoluteNumerator % denominator;

  if (remainder === 0) {
    return <span>{sign}{whole}</span>;
  }

  return (
    <span
      className="inline-flex items-baseline gap-1 tabular-nums"
      aria-label={value.label}
    >
      {whole > 0 ? <span>{sign}{whole}</span> : sign ? <span>{sign}</span> : null}
      <span className="relative inline-grid h-[1.24em] min-w-[1.5em] translate-y-[0.14em] place-items-center text-[0.68em] leading-none">
        <span className="absolute left-0 top-0 translate-x-[0.06em] -translate-y-[0.16em]">
          {remainder}
        </span>
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-px w-[1.45em] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-current"
        />
        <span className="absolute bottom-0 right-0 translate-x-[0.02em] translate-y-[0.02em]">
          {denominator}
        </span>
      </span>
    </span>
  );
}
