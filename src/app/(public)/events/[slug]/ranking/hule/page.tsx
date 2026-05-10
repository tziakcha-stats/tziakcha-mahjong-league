import { permanentRedirect } from "next/navigation";

export default async function HuleRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/events/${slug}/ranking`);
}
