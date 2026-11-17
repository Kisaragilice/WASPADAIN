import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { resolveConfig } from "@/lib/attempt";
import { BongkarClient } from "@/components/bongkar/bongkar-client";

export default async function BongkarPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { slug, attemptId } = await params;

  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id: attemptId },
    include: { scenario: true },
  });

  if (!attempt || attempt.userId !== user.id || attempt.scenario.slug !== slug) {
    notFound();
  }
  if (attempt.status !== "COMPLETED") {
    redirect(`/simulasi/${slug}`);
  }

  const { config } = resolveConfig(attempt.scenario, attempt.variantIndex);

  return (
    <BongkarClient
      slug={attempt.scenario.slug}
      title={attempt.scenario.title}
      attemptId={attempt.id}
      outcome={attempt.outcome ?? "VULNERABLE"}
      config={config}
    />
  );
}
