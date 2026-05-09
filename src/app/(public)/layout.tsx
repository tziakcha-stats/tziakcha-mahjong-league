import type { ReactNode } from "react";
import { PublicSiteHeader } from "@/features/events/components/public-site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <PublicSiteHeader />
      {children}
    </div>
  );
}
