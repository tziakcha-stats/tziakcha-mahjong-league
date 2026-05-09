import { notFound } from "next/navigation";
import { EventSubnav } from "@/features/events/components/event-subnav";
import { MatchRecordsTable } from "@/features/matches/components/match-records-table";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventMatchesPage({
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
      <EventSubnav slug={slug} currentPath={`/events/${slug}/matches`} />
      <MatchRecordsTable matches={detail.matches} />
    </div>
  );
}
