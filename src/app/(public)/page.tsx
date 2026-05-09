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
          eyebrow="赛事目录"
          title="不同赛事，从门户首页进入"
          description="首页刻意保持简洁，突出不同赛事的身份与入口。每个赛事进入后，再进入自己的完整数据空间。"
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
          title="只保留少量有价值的信息"
          description="不把首页做成重数据看板，但保留可帮助用户快速判断站点状态的全站摘要。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="赛事总数" value="3" note="当前门户已收录 3 个赛事空间" />
          <StatCard label="活跃赛事" value="2" note="包含进行中与报名中的赛事" />
          <StatCard label="最近更新" value="03.13" note="春季公开赛已更新到预赛第 6 轮" />
        </div>
      </section>
    </main>
  );
}
