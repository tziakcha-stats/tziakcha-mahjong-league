import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="admin-shell flex min-h-screen items-center justify-center px-4">
      <section className="admin-card w-full max-w-md rounded-[32px] border p-8">
        <p className="display-font text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          Admin Access
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-admin-ink">后台登录壳子</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          第一版仅展示登录页视觉与后续入口，不接真实鉴权。
        </p>
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            账号输入框占位
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            密码输入框占位
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-admin-ink px-5 py-3 text-sm font-semibold text-white"
          >
            进入后台
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            返回门户首页
          </Link>
        </div>
      </section>
    </main>
  );
}
