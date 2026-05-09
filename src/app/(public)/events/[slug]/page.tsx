import { notFound } from "next/navigation";
import { EventOverview } from "@/features/events/components/event-overview";
import { EventSubnav } from "@/features/events/components/event-subnav";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventPage({
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
      <EventSubnav slug={slug} currentPath={`/events/${slug}`} />
      <EventOverview detail={detail} />
    </div>
  );
}
