import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { EventDetailHeader } from "@/features/events/components/event-detail-header";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventLayout({
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
    <main className="container py-10 pb-16">
      <EventDetailHeader event={detail.event} />
      <div className="mt-8">{children}</div>
    </main>
  );
}
