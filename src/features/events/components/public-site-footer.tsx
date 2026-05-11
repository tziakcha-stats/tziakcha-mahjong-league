export function PublicSiteFooter() {
  return (
    <footer className="border-t border-line/80 bg-white/60">
      <div className="container grid gap-6 py-8 text-sm text-[#6f675d] md:grid-cols-[1.2fr_1fr] md:items-end">
        <div className="space-y-3">
          <p className="display-font text-base font-semibold tracking-[0.18em] text-[#16120f]">
            大渣林
          </p>
          <p className="leading-7">
            本网站开源在{" "}
            <a
              className="font-medium text-brand underline-offset-4 hover:underline"
              href="https://github.com/tziakcha-stats"
              rel="noreferrer"
              target="_blank"
            >
              GitHub tziakcha-stats
            </a>
            ，作者 Choimoe。使用 Next.js、React、TypeScript 与 Tailwind CSS 构建。
          </p>
        </div>

        <div className="space-y-2 md:text-right">
          <p>如需添加比赛，可以通过邮件联系我。</p>
          <a
            className="font-medium text-brand underline-offset-4 hover:underline"
            href="mailto:qwqshq@gmail.com"
          >
            qwqshq@gmail.com
          </a>
          <p>
            <a
              className="text-[#6f675d] underline-offset-4 hover:text-brand hover:underline"
              href="https://beian.miit.gov.cn/"
              rel="noreferrer"
              target="_blank"
            >
              鲁ICP备2025190412号-1
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
