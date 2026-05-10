import { EventCard } from "@/features/events/components/event-card";
import { HomeHero } from "@/features/events/components/home-hero";
import { getEvents, getFeaturedEvent } from "@/shared/data/repositories";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StatCard } from "@/shared/ui/stat-card";

export default function HomePage() {
  const events = getEvents();
  const featuredEvent = getFeaturedEvent();

  return (
    <main className="pb-16">
      <HomeHero featuredEvent={featuredEvent} />

      <section className="container py-8 sm:py-12">
        <SectionHeading
          eyebrow="赛事入口"
          title="SDU 国标麻将团体赛"
          description="山东大学麻将部主办的国标麻将团队赛，采用常规赛、半决赛、决赛三阶段团体积分赛制。"
        />
        <div className="grid-stagger mt-8 grid gap-5 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </section>

      <section id="updates" className="container py-8 sm:py-12">
        <SectionHeading
          eyebrow="赛事概况"
          title="赛程与数据同步更新"
          description="查看赛程、排名、对局记录与选手数据，跟进 SDU 国标麻将团体赛的最新进展。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="赛事" value="1" note="SDU 国标麻将团体赛" />
          <StatCard label="参赛队伍" value="12" note="SDU 国标麻将团体赛当前参赛队伍数" />
          <StatCard label="最近更新" value="05.24" note="已更新至小组赛第 5 轮数据" />
        </div>
      </section>
    </main>
  );
}
