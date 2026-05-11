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
          description="常规赛数据归档已完成，半决赛入口同步开放，可查看两个阶段的赛程、规则、队伍与排名数据。"
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
          description="首页主推常规赛完整数据，同时提供半决赛入口，便于跟进半决赛阶段安排。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="赛事" value="2" note="常规赛归档 / 半决赛入口" />
          <StatCard label="晋级队伍" value="6" note="常规赛前 6 名进入半决赛" />
          <StatCard label="最近更新" value="06.06" note="半决赛完整赛程已发布" />
        </div>
      </section>
    </main>
  );
}
