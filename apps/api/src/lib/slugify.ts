/**
 * Generates a URL-safe slug from a name, with a short random suffix to
 * guarantee uniqueness without a database round-trip on every attempt —
 * collisions are still possible in principle, so callers retry on the
 * unique-constraint error the repository surfaces (see projects.repository).
 */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "project"}-${suffix}`;
}
