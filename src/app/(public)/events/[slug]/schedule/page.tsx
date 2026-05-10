import { notFound } from "next/navigation";
import { ScheduleRoundList } from "@/features/schedule/components/schedule-round-list";
import { getEventDetail } from "@/shared/data/repositories";

export default async function EventSchedulePage({
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
      <ScheduleRoundList rounds={detail.schedule} />
    </div>
  );
}
