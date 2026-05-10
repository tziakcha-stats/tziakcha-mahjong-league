import { notFound } from "next/navigation";
import { RateRankingTable } from "@/features/ranking/components/rate-ranking-table";
import { getLeaderboard } from "@/shared/data/repositories";

export default async function ZimoRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = getLeaderboard(slug, "zimoRate");

  if (!rows.length) {
    notFound();
  }

  return (
    <RateRankingTable
      title="自摸率榜单"
      description="统计每位选手的自摸和牌占比，适合观察门清推进和收尾能力。"
      rows={rows}
      valueLabel="自摸率"
    />
  );
}
