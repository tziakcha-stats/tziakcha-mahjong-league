import { notFound } from "next/navigation";
import { EventSubnav } from "@/features/events/components/event-subnav";
import { RankingTable } from "@/features/ranking/components/ranking-table";
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
    <div className="space-y-6">
      <EventSubnav slug={slug} currentPath={`/events/${slug}/ranking`} />
      <RankingTable ranking={detail.ranking} />
    </div>
  );
}
