import Link from "next/link";

export function PublicSiteHeader() {
  return (
    <header className="border-b border-line/80">
      <div className="container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white">
            茶
          </div>
          <div>
            <p className="display-font text-lg font-bold uppercase tracking-[0.18em]">
              Tziakcha League
            </p>
            <p className="text-xs text-muted">赛事展示与管理前端原型</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/">首页</Link>
          <Link href="/events">赛事列表</Link>
          <a href="#updates">近期更新</a>
          <Link href="/admin">后台入口</Link>
        </nav>
      </div>
    </header>
  );
}
