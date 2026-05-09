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
          title="当前仅展示 SDU 国标麻将团体赛"
          description="第一版收敛为单赛事展示站，首页保留赛事入口与摘要信息，进入后查看完整的赛事数据空间。"
        />
        <div className="grid-stagger mt-8 grid gap-5 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </section>

      <section id="updates" className="container py-8 sm:py-12">
        <SectionHeading
          eyebrow="全站摘要"
          title="保留少量核心摘要"
          description="首页不做重数据看板，只保留帮助用户快速理解当前赛事状态的少量摘要信息。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="赛事总数" value="1" note="当前站点仅保留一个赛事空间" />
          <StatCard label="参赛队伍" value="12" note="SDU 国标麻将团体赛当前参赛队伍数" />
          <StatCard label="最近更新" value="05.24" note="已更新至小组赛第 5 轮数据" />
        </div>
      </section>
    </main>
  );
}
