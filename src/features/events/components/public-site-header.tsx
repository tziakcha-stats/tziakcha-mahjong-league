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
            <p className="text-xs text-[#6f675d]">SDU 国标麻将团体赛</p>
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
