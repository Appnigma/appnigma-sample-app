import type { JsonValue } from "@appnigma/sdk";

const isJsonRecord = (value: JsonValue | string | null): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// The text at a dotted path such as "data.company_name", or null.
const textAt = (body: JsonValue | string | null, path: string): string | null => {
  let current: JsonValue | string | null = body;
  for (const key of path.split(".")) {
    if (!isJsonRecord(current)) return null;
    current = current[key] ?? null;
  }
  if (typeof current === "string") return current.trim() === "" ? null : current;
  if (typeof current === "number" || typeof current === "boolean") return String(current);
  return null;
};

export { textAt };
