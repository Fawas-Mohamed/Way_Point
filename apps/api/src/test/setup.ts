// Minimal, valid env so config/env.ts's fail-fast validation passes when
// unit tests import modules that transitively import env.ts (e.g. via
// lib/prisma.ts). No real database or secrets are used — every test in
// this suite mocks the repository layer directly.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test?schema=public";
process.env.JWT_ACCESS_SECRET = "test-access-secret-please-do-not-use-in-prod-xxxx";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-please-do-not-use-in-prod-xxx";
