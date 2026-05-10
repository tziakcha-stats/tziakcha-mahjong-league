import { permanentRedirect } from "next/navigation";

export default async function BeiZimoRatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/events/${slug}/ranking`);
}
