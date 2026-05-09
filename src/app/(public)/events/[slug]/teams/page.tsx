import { notFound } from "next/navigation";
import { TeamInfoGrid } from "@/features/events/components/team-info-grid";
import { EventSubnav } from "@/features/events/components/event-subnav";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventTeamsPage({
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
      <EventSubnav slug={slug} currentPath={`/events/${slug}/teams`} />
      <TeamInfoGrid teams={detail.teams} />
    </div>
  );
}
