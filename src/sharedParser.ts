export function getPath(value: unknown, path: number[]): unknown {
  let current = value;
  for (const index of path) {
    if (!Array.isArray(current)) return undefined;
    current = current[index];
  }
  return current;
}

export function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export function valueOrNull(value: unknown): unknown | null {
  return value ?? null;
}

export function stringOrDefault(value: unknown, fallback: string): string {
  const text = stringOrEmpty(value);
  return text.length > 0 ? text : fallback;
}