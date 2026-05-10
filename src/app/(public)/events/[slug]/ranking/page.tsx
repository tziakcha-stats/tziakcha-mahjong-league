import { notFound } from "next/navigation";
import { RankingTable } from "@/features/ranking/components/ranking-table";
import { getEventDetail } from "@/shared/data/repositories";
import Link from "next/link";

export default async function EventRankingPage({
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
      <section className="surface-card rounded-[30px] border border-line p-6">
        <h2 className="text-3xl font-semibold tracking-tight text-[#16120f]">
          榜单总览
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#6f675d]">
          这里保留总积分榜，同时提供和牌率、自摸率、放铳率三个独立榜单入口。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/events/${slug}/ranking/hule`} className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-[#6f675d]">
            和牌率
          </Link>
          <Link href={`/events/${slug}/ranking/zimo`} className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-[#6f675d]">
            自摸率
          </Link>
          <Link href={`/events/${slug}/ranking/fangchong`} className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-[#6f675d]">
            放铳率
          </Link>
        </div>
      </section>
      <RankingTable ranking={detail.ranking} />
    </div>
  );
}
