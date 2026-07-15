import { prisma } from "../lib/prisma";

type JsonPrimitive = string | number | boolean | null;
type JsonRecord = { [key: string]: JsonPrimitive | JsonPrimitive[] | JsonRecord };

interface LogActivityInput {
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata?: JsonRecord;
}

/**
 * Writes one append-only row to activity_logs. Deliberately fire-and-forget
 * friendly (callers can `await` it, but a failure here should never block
 * the primary operation it's describing) — callers wrap it accordingly.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.activityLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      metadata: input.metadata,
    },
  });
}
