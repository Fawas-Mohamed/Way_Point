/**
 * Only NEXT_PUBLIC_-prefixed variables are ever available in the browser
 * bundle. Centralized here so a typo in an env var name fails at the one
 * place that reads it, rather than silently producing `undefined` deep in
 * a component.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
};
