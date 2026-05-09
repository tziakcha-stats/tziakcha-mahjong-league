import { EventCard } from "@/features/events/components/event-card";
import { getEvents } from "@/shared/data/repositories";
import { SectionHeading } from "@/shared/ui/section-heading";

export default function EventsPage() {
  const events = getEvents();

  return (
    <main className="container py-12 pb-16">
      <SectionHeading
        eyebrow="赛事列表"
        title="全部赛事空间"
        description="这里集中展示当前门户已接入的赛事。未来支持更多联赛品牌时，这里可以继续扩展筛选、标签和时间维度。"
      />
      <div className="grid-stagger mt-8 grid gap-5 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </div>
    </main>
  );
}
