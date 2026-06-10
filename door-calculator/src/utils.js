const FRACTIONS_BY_EIGHTH = {
  1: "1/8",
  2: "1/4",
  3: "3/8",
  4: "1/2",
  5: "5/8",
  6: "3/4",
  7: "7/8",
};

const EIGHTH_TOLERANCE = 0.01;

export const roundDimension = (value, precision = 100000) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue * precision) / precision;
};

export const parseFraction = (value) => {
  if (typeof value === "number") {
    return roundDimension(value);
  }

  if (value == null) {
    return 0;
  }

  const trimmedValue = String(value).replace(/"/g, "").trim();

  if (!trimmedValue) {
    return 0;
  }

  const normalizedValue = trimmedValue.replace(/\s*-\s*/g, " ");

  if (/^-?\d+(\.\d+)?$/.test(normalizedValue)) {
    return roundDimension(Number(normalizedValue));
  }

  const mixedMatch = normalizedValue.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);

  if (mixedMatch) {
    const [, wholePart, numerator, denominator] = mixedMatch;
    const parsedDenominator = Number(denominator);

    if (!parsedDenominator) {
      return Number.NaN;
    }

    const wholeNumber = Number(wholePart);
    const sign = wholeNumber < 0 ? -1 : 1;
    const fractionValue = Number(numerator) / parsedDenominator;

    return roundDimension((Math.abs(wholeNumber) + fractionValue) * sign);
  }

  const fractionMatch = normalizedValue.match(/^(-?\d+)\/(\d+)$/);

  if (fractionMatch) {
    const [, numerator, denominator] = fractionMatch;
    const parsedDenominator = Number(denominator);

    if (!parsedDenominator) {
      return Number.NaN;
    }

    return roundDimension(Number(numerator) / parsedDenominator);
  }

  return Number.NaN;
};

export const formatDecimalInput = (value) => {
  if (!Number.isFinite(value)) {
    return "";
  }

  return roundDimension(value).toString();
};

export const toFraction = (value) => {
  if (!Number.isFinite(value)) {
    return "";
  }

  const roundedValue = roundDimension(value, 100000);
  const sign = roundedValue < 0 ? "-" : "";
  const absoluteValue = Math.abs(roundedValue);
  const whole = Math.floor(absoluteValue);
  const fraction = absoluteValue - whole;

  const thirtySeconds = Math.round(fraction * 32);

  if (thirtySeconds === 0) {
    return `${sign}${whole}"`;
  }
  if (thirtySeconds === 32) {
    return `${sign}${whole + 1}"`;
  }

  if (thirtySeconds % 2 === 0) {
    const sixteenths = thirtySeconds / 2;
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(sixteenths, 16);
    const num = sixteenths / divisor;
    const den = 16 / divisor;
    const fracStr = `${num}/${den}`;
    return whole > 0 ? `${sign}${whole} ${fracStr}"` : `${sign}${fracStr}"`;
  } else {
    const sixteenths = (thirtySeconds - 1) / 2;
    let baseFracStr = "";
    if (sixteenths > 0) {
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(sixteenths, 16);
      const num = sixteenths / divisor;
      const den = 16 / divisor;
      baseFracStr = ` ${num}/${den}`;
    }
    return `${sign}${whole}${baseFracStr}"|+1/32`;
  }
};
