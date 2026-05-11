export function greatestCommonDivisor(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

export function createFraction(numerator, denominator = 1) {
  if (denominator === 0) {
    throw new Error("Fraction denominator cannot be zero.");
  }

  const sign = denominator < 0 ? -1 : 1;
  const normalizedNumerator = numerator * sign;
  const normalizedDenominator = Math.abs(denominator);
  const divisor = greatestCommonDivisor(normalizedNumerator, normalizedDenominator);

  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor,
  };
}

export function addFractions(left, right) {
  return createFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function subtractFractions(left, right) {
  return addFractions(left, createFraction(-right.numerator, right.denominator));
}

export function formatFraction(fraction) {
  const normalized = createFraction(fraction.numerator, fraction.denominator);
  const { numerator, denominator } = normalized;

  if (denominator === 1) {
    return String(numerator);
  }

  const absoluteNumerator = Math.abs(numerator);
  const whole = Math.trunc(absoluteNumerator / denominator);
  const remainder = absoluteNumerator % denominator;
  const sign = numerator < 0 ? "-" : "";

  if (whole === 0) {
    return `${sign}${remainder}/${denominator}`;
  }

  if (remainder === 0) {
    return `${sign}${whole}`;
  }

  return `${sign}${whole}又${remainder}/${denominator}`;
}

export function serializeFraction(fraction) {
  const normalized = createFraction(fraction.numerator, fraction.denominator);

  return {
    ...normalized,
    label: formatFraction(normalized),
  };
}

export function fractionToNumber(fraction) {
  return fraction.numerator / fraction.denominator;
}

export function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

export function roundToSixDecimals(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
