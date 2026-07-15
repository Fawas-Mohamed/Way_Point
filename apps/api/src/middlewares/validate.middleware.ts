import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { ValidationError } from "../common/errors";

type RequestPart = "body" | "query" | "params";

function zodErrorToDetails(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    details[path] = details[path] ? [...details[path], issue.message] : [issue.message];
  }
  return details;
}

/**
 * Validates a single request part against a Zod schema shared with the
 * frontend (from @waypoint/types), and replaces that part of the request
 * with the parsed (and coerced/defaulted) result — so controllers always
 * receive already-clean, already-typed data.
 */
export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      throw new ValidationError("The submitted data is invalid", zodErrorToDetails(result.error));
    }
    req[part] = result.data;
    next();
  };
}
