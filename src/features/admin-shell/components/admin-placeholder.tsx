import { SectionHeading } from "@/shared/ui/section-heading";

export function AdminPlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="admin-card rounded-[30px] border p-6 sm:p-8">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          表格区占位。后续可接赛事列表、筛选和状态管理。
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          表单区占位。后续可扩展新增、编辑、发布流程。
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          操作记录区占位。后续可接日志、审核与权限控制。
        </div>
      </div>
    </section>
  );
}
