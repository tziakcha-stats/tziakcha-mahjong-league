import { notFound } from "next/navigation";
import { RateRankingTable } from "@/features/ranking/components/rate-ranking-table";
import { getLeaderboard } from "@/shared/data/repositories";

export default async function FangchongRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = getLeaderboard(slug, "fangchongRate");

  if (!rows.length) {
    notFound();
  }

  return (
    <RateRankingTable
      title="放铳率榜单"
      description="统计每位选手的放铳控制能力，数值越低通常代表防守更稳定。"
      rows={rows}
      valueLabel="放铳率"
    />
  );
}
