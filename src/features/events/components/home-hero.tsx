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
              Mahjong League Portal
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                多赛事入口首页，先看联赛，再进入每一场赛事的数据空间。
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                第一版聚焦公开展示与后台壳子，把赛事品牌、赛事入口和赛事数据空间拆分清楚，为后续接入管理后台与个人系统预留结构。
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/events">
                <Button className="h-11 rounded-full bg-white px-5 text-brand-strong hover:bg-white/90">
                  浏览全部赛事
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
                >
                  进入后台壳子
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="display-font text-xs uppercase tracking-[0.26em] text-white/60">
              Featured Event
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
