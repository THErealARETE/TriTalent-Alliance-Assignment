/**
 * Converts a price string such as "$29.99" or "Item total: $39.98" to integer cents.
 * Working in cents avoids floating-point rounding errors when summing prices.
 */
export function toCents(text: string): number {
  const match = text.match(/\$(\d+)\.(\d{2})/);
  if (!match) {
    throw new Error(`No price found in "${text}"`);
  }
  return Number(match[1]) * 100 + Number(match[2]);
}
