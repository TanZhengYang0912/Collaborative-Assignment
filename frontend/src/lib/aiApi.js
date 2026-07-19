export const DEFAULT_AI_API_BASE = "http://localhost:8000/api";

export function getAiApiBase(configuredBase = "") {
  const base = String(configuredBase || DEFAULT_AI_API_BASE).replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}
