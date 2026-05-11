import { notFound } from "next/navigation";
import { AnalysisPanel } from "@/features/ranking/components/analysis-panel";
import { getEventDetail } from "@/shared/data/repositories";

export default async function HuleRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getEventDetail(slug);

  if (!detail) {
    notFound();
  }

  return <AnalysisPanel leaderboards={detail.leaderboards} />;
}
