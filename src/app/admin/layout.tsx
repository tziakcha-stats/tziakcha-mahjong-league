import type { ReactNode } from "react";
import { AdminSidebar } from "@/features/admin-shell/components/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <div className="container grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <AdminSidebar />
        <div className="space-y-6">
          <header className="admin-card rounded-[28px] border px-6 py-5">
            <p className="display-font text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              Management Preview
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-admin-ink">
              后台结构壳子
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              第一版只完成路由、布局和占位区域，不做真实表单与权限，但目录结构已经为后续赛事管理能力预留好边界。
            </p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
