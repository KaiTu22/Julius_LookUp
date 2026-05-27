// Fields stripped from Julius responses before they reach our cache,
// archive, or frontend. Add more here if other sensitive data appears.
const SENSITIVE_FIELDS = new Set([
  "contacts",
]);

export function stripSensitive(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stripSensitive);
  if (typeof value !== "object") return value;

  const cleaned = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) continue;
    cleaned[key] = stripSensitive(val);
  }
  return cleaned;
}
