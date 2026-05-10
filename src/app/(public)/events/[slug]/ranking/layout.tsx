import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getEventDetail } from "@/shared/data/repositories";
import { RankingSubnav } from "@/features/ranking/components/ranking-subnav";

export default async function RankingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getEventDetail(slug);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <RankingSubnav slug={slug} />
      {children}
    </div>
  );
}
