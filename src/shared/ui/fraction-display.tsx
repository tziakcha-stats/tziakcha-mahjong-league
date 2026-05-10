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
      className="inline-flex items-baseline gap-0.5 tabular-nums"
      aria-label={value.label}
    >
      {whole > 0 ? <span>{sign}{whole}</span> : sign ? <span>{sign}</span> : null}
      <span className="text-[0.78em] leading-none">
        {remainder}/{denominator}
      </span>
    </span>
  );
}
