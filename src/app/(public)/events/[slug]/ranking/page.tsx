import { notFound } from "next/navigation";
import { RankingPanel } from "@/features/ranking/components/ranking-panel";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventRankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getEventDetail(slug);

  if (!detail) {
    notFound();
  }

  return (
    <RankingPanel
      ranking={detail.ranking}
      teamRanking={detail.teamRanking}
      leaderboards={detail.leaderboards}
    />
  );
}
