import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LeagueEvent } from "@/shared/data/types";
import { formatDateRange } from "@/lib/utils";

export function HomeHero({ featuredEvent }: { featuredEvent: LeagueEvent }) {
  return (
    <section className="container py-12 sm:py-16">
      <div className="brand-gradient overflow-hidden rounded-[36px] border border-white/10 px-6 py-8 text-white shadow-[0_30px_80px_rgba(74,16,16,0.22)] sm:px-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="display-font text-sm font-semibold uppercase tracking-[0.36em] text-white/70">
              Tziakcha League
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                SDU 国标麻将团体赛赛程与数据更新。
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                汇总赛程安排、队伍排名、选手排行与对局记录，跟进常规赛、半决赛和决赛的实时进展。
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/events">
                <Button className="h-11 rounded-full bg-white px-5 text-brand-strong hover:bg-white/90">
                  查看赛事
                </Button>
              </Link>
              <Link href={`/events/${featuredEvent.slug}/ranking`}>
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
                >
                  查看排名
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="display-font text-xs uppercase tracking-[0.26em] text-white/60">
              正在进行
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {featuredEvent.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              {featuredEvent.tagline}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">时间</p>
                <p className="mt-2 font-semibold">
                  {formatDateRange(featuredEvent.startDate, featuredEvent.endDate)}
                </p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">规模</p>
                <p className="mt-2 font-semibold">
                  {featuredEvent.players} 名选手 / {featuredEvent.rounds} 轮
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
