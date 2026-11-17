import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { startAttempt, resolveConfig } from "@/lib/attempt";
import { SimulatorClient } from "@/components/simulator/simulator-client";

export default async function SimulatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ restart?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const query = await searchParams;

  const preTest = await prisma.assessment.findFirst({
    where: { userId: user.id, type: "PRE" },
    select: { id: true },
  });
  if (!preTest) {
    redirect(`/kab/pre-test?next=/simulasi/${slug}`);
  }

  const scenario = await prisma.scenario.findFirst({
    where: { slug, isPublished: true },
  });
  if (!scenario) notFound();

  const attempt = await startAttempt({
    userId: user.id,
    scenario,
    restart: query.restart === "1",
  });

  const { config } = resolveConfig(scenario, attempt.variantIndex);
  const currentSceneId = attempt.currentSceneId ?? config.startSceneId;

  return (
    <SimulatorClient
      slug={scenario.slug}
      title={scenario.title}
      subtitle={scenario.subtitle}
      channel={scenario.channel}
      difficulty={scenario.difficulty}
      estimatedMinutes={scenario.estimatedMinutes}
      level={scenario.level}
      config={config}
      attemptId={attempt.id}
      currentSceneId={currentSceneId}
    />
  );
}
