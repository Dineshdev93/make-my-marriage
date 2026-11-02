import type { ReactNode } from "react";

function Logo({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${mobile ? "justify-center" : ""}`}>
      <svg aria-hidden="true" className="h-8 w-10 shrink-0" viewBox="0 0 40 28" fill="none">
        <circle cx="15" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="25" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="font-heading text-xl tracking-tight">Make My Marriage</span>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen bg-background text-foreground lg:flex-row">
      <aside className="hidden min-h-screen w-[40%] flex-col justify-between bg-wine-deep p-10 text-background lg:flex xl:p-12">
        <Logo />
        <p className="my-auto max-w-md font-heading text-5xl leading-tight tracking-tight text-background xl:text-6xl">
          Every function. Every rupee. One calm place.
        </p>
        <p className="text-xs tracking-wide text-border">© Make My Marriage</p>
      </aside>
      <section className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[60%] lg:px-12">
        <div className="mb-8 text-wine-deep lg:hidden"><Logo mobile /></div>
        <div className="w-full max-w-[440px]">{children}</div>
      </section>
    </main>
  );
}
