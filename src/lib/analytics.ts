import { prisma } from "@/lib/prisma";

export async function trackEvent(input: {
  event: string;
  path?: string;
  userId?: string | null;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event: input.event,
        path: input.path ?? null,
        userId: input.userId ?? null,
      },
    });
  } catch {
    // Analytics failures should never break user actions.
  }
}
