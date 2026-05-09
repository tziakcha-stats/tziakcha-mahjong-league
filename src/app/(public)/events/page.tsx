import { EventCard } from "@/features/events/components/event-card";
import { getEvents } from "@/shared/data/repositories";
import { SectionHeading } from "@/shared/ui/section-heading";

export default function EventsPage() {
  const events = getEvents();

  return (
    <main className="container py-12 pb-16">
      <SectionHeading
        eyebrow="赛事页面"
        title="SDU 国标麻将团体赛"
        description="当前列表页仅保留一个赛事，后续如果需要恢复多赛事结构，继续在同一份 mock 数据文件中扩展即可。"
      />
      <div className="grid-stagger mt-8 grid gap-5 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </div>
    </main>
  );
}
