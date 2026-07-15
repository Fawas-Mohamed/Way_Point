import rateLimit from "express-rate-limit";

/**
 * Auth endpoints get a tighter limit than the general API — this is the
 * surface brute-force and credential-stuffing attempts target first.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many attempts — please try again later", code: "TOO_MANY_REQUESTS" },
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many requests — please slow down", code: "TOO_MANY_REQUESTS" },
  },
});
