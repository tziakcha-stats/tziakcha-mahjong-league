import { notFound } from "next/navigation";
import { RateRankingTable } from "@/features/ranking/components/rate-ranking-table";
import { getLeaderboard } from "@/shared/data/repositories";

export default async function HuleRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = getLeaderboard(slug, "huleRate");

  if (!rows.length) {
    notFound();
  }

  return (
    <RateRankingTable
      title="和牌率榜单"
      description="统计每位选手的和牌效率，数值越高表示越容易在对局中完成和牌。"
      rows={rows}
      valueLabel="和牌率"
    />
  );
}
