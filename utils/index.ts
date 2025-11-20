// takes an array and turns it into a plain object
export function attrsToMap(attrs: any[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!attrs) return out;
  for (const item of attrs) {
    if (!item) continue;
    const { key, value } = item as { key: string; value: string };
    out[key] = value;
  }
  return out;
}
