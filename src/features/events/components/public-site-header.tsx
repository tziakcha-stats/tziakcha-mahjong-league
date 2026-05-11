import Link from "next/link";

export function PublicSiteHeader() {
  return (
    <header className="border-b border-line/80">
      <div className="container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/sduleague/brand-icon.png"
            alt="大渣林"
            className="h-12 w-12 rounded-2xl object-contain"
          />
          <div>
            <p className="display-font text-lg font-bold uppercase tracking-[0.18em]">
              大渣林
            </p>
            <p className="text-xs text-[#6f675d]">国标麻将网络联赛赛事管理平台</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-[#6f675d] md:flex">
          <Link href="/">首页</Link>
          <Link href="/events">赛事</Link>
          <a href="#updates">赛事概况</a>
        </nav>
      </div>
    </header>
  );
}
