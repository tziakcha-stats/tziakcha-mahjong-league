import type { ReactNode } from "react";
import { PublicSiteHeader } from "@/features/events/components/public-site-header";
import { PublicSiteFooter } from "@/features/events/components/public-site-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <PublicSiteHeader />
      {children}
      <PublicSiteFooter />
    </div>
  );
}
