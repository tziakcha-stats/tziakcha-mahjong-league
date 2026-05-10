import { permanentRedirect } from "next/navigation";

export default async function FangchongRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/events/${slug}/analysis`);
}
