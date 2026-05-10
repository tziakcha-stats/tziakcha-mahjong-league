import { notFound } from "next/navigation";
import { StatsGrid } from "@/features/stats/components/stats-grid";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventStatsPage({
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
    <div className="space-y-6">
      <StatsGrid stats={detail.stats} />
    </div>
  );
}
