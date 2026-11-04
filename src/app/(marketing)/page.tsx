import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make My Marriage — Wedding planning, made calm",
  description: "Plan your wedding budget, functions, tasks, and guest list in one calm workspace made for Indian couples.",
};

const features = [
  {
    number: "01",
    title: "Budget and expenses",
    description: "Set one budget, record each expense, and see what remains.",
    preview: <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm">Catering · Sangeet menu</span><span className="shrink-0 font-heading text-lg">₹2,80,000</span></div>,
  },
  {
    number: "02",
    title: "Functions",
    description: "Keep every function, date, and venue in one simple list.",
    preview: <><p className="text-sm font-medium">Mehendi</p><p className="mt-1 text-xs text-muted">12 March 2027 · Royal Terraces</p></>,
  },
  {
    number: "03",
    title: "Tasks",
    description: "Make a checklist with due dates. Overdue tasks are easy to spot.",
    preview: <><div className="flex items-center justify-between gap-2 text-xs"><span className="truncate">Finalize henna artist</span><span className="whitespace-nowrap rounded-md bg-[#4A6074]/10 px-2 py-1 text-[#4A6074]">Overdue</span></div><div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs"><span className="truncate text-muted line-through">Book the venue</span><span className="whitespace-nowrap rounded-md bg-[#9FB09A]/15 px-2 py-1 text-foreground">Completed</span></div></>,
  },
  {
    number: "04",
    title: "Guests",
    description: "Keep names, phone numbers, family groups, and invitation status together.",
    preview: <><div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium">Verma family</span><span className="whitespace-nowrap text-[#536350]">Confirmed</span></div><div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs"><span className="font-medium">Singhania family</span><span className="whitespace-nowrap text-muted">Invited</span></div></>,
  },
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <svg aria-hidden="true" className={`h-6 w-6 ${light ? "text-background/80" : "text-primary"}`} fill="none" viewBox="0 0 28 28">
        <circle cx="10" cy="14" r="8" stroke="currentColor" />
        <circle cx="18" cy="14" r="8" stroke="currentColor" />
      </svg>
      <span className={`font-heading text-xl tracking-tight ${light ? "text-background" : "text-foreground"}`}>Make My Marriage</span>
    </span>
  );
}

function BudgetPreview() {
  return (
    <div aria-label="Example wedding budget preview" className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-background px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted">
        <span className="h-2 w-2 rounded-full bg-border" /><span className="h-2 w-2 rounded-full bg-border" /><span className="h-2 w-2 rounded-full bg-border" />
        <span className="ml-2">Wedding overview preview</span>
      </div>
      <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:px-8 sm:py-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">A wedding planner</p>
          <p className="mt-1 font-heading text-2xl sm:text-3xl">Aarav &amp; Meera</p>
          <p className="mt-1 text-xs text-muted">Sunday, 14 March 2027</p>
        </div>
        <div className="flex items-baseline gap-2 self-start sm:self-center"><span className="font-heading text-4xl font-light text-primary sm:text-5xl">135</span><span className="font-heading text-base italic text-muted">days to go</span></div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4 sm:px-7 sm:py-5"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Total budget</p><p className="mt-2 font-heading text-2xl">₹15,00,000</p></div>
        <div className="px-5 py-4 sm:px-7 sm:py-5"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Recorded expenses</p><p className="mt-2 font-heading text-2xl">₹9,42,000</p><p className="mt-1 text-xs text-muted">63% of the budget used</p></div>
        <div className="px-5 py-4 sm:px-7 sm:py-5"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Remaining budget</p><p className="mt-2 font-heading text-2xl text-primary">₹5,58,000</p></div>
      </div>
      <div className="h-1.5 bg-border"><div className="h-full w-[63%] bg-primary" /></div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div aria-label="Example wedding dashboard preview" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-background px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-muted"><span className="h-2 w-2 rounded-full bg-border" /><span className="h-2 w-2 rounded-full bg-border" /><span className="h-2 w-2 rounded-full bg-border" /><span className="ml-2">Wedding dashboard preview</span></div>
      <div className="grid min-h-[440px] md:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-background p-5 md:block">
          <Brand />
          <p className="mb-2 mt-8 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted">Wedding</p>
          <div className="rounded-lg border-l-[3px] border-primary bg-[#EFE8DF] px-3 py-2.5 text-sm font-medium text-primary">Dashboard</div>
          <ul className="mt-2 space-y-1 text-sm text-muted"><li className="px-3 py-2">Budget and Expenses</li><li className="px-3 py-2">Functions</li><li className="px-3 py-2">Tasks</li><li className="px-3 py-2">Guests</li></ul>
        </aside>
        <div className="min-w-0">
          <div className="border-b border-border p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-heading text-2xl sm:text-3xl">Aarav &amp; Meera</p><p className="mt-1 text-xs text-muted">Sunday, 14 March 2027</p></div><p className="font-heading text-3xl text-primary">135 <span className="text-base italic text-muted">days to go</span></p></div></div>
          <div className="flex flex-wrap gap-2 border-b border-border bg-background p-4">
            <span className="whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-medium text-background">+ Add Expense</span><span className="whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs">+ Add Function</span><span className="whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs">+ Add Task</span><span className="whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs">+ Add Guest</span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Total budget</p><p className="mt-2 font-heading text-xl">₹15,00,000</p></div><div className="p-4"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Recorded expenses</p><p className="mt-2 font-heading text-xl">₹9,42,000</p></div><div className="p-4"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Remaining budget</p><p className="mt-2 font-heading text-xl text-primary">₹5,58,000</p></div>
          </div>
          <div className="h-1 bg-border"><div className="h-full w-[63%] bg-primary" /></div>
          <div className="grid divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <div className="p-5"><h3 className="font-heading text-xl">Upcoming functions</h3><div className="mt-3 divide-y divide-border text-sm"><p className="py-3"><span className="font-medium">Haldi</span><span className="mt-1 block text-xs text-muted">12 March 2027 · The Courtyard</span></p><p className="py-3"><span className="font-medium">Mehendi</span><span className="mt-1 block text-xs text-muted">12 March 2027 · Royal Terraces</span></p><p className="py-3"><span className="font-medium">Sangeet</span><span className="mt-1 block text-xs text-muted">13 March 2027 · Grand Ballroom</span></p></div></div>
            <div className="p-5"><h3 className="font-heading text-xl">Upcoming tasks</h3><div className="mt-3 divide-y divide-border text-sm"><p className="flex items-center justify-between gap-3 py-3"><span>Finalize henna artist</span><span className="whitespace-nowrap rounded-md bg-[#4A6074]/10 px-2 py-1 text-[10px] text-[#4A6074]">Overdue</span></p><p className="py-3">Confirm catering menu</p><p className="py-3">Book the photographer</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link aria-label="Make My Marriage home" href="#top"><Brand /></Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-muted md:flex"><a className="hover:text-foreground" href="#features">Features</a><a className="hover:text-foreground" href="#how-it-works">How it works</a><a className="hover:text-foreground" href="#together">Together</a></nav>
          <div className="flex shrink-0 items-center gap-3"><Link className="whitespace-nowrap px-2 py-2 text-sm text-muted hover:text-foreground" href="/login">Log in</Link><Link className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[10px] bg-primary px-4 text-sm font-medium text-background hover:bg-primary-hover sm:px-5" href="/register">Start planning</Link></div>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate overflow-hidden border-b border-border">
          <Image alt="Bride and groom celebrating their wedding together" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-25 mix-blend-multiply" fill priority sizes="100vw" src="/images/bride-groom.png" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/90 via-background/55 to-background" />
          <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pb-20 pt-20 text-center sm:px-8 sm:pb-24 sm:pt-28">
            <span className="mb-7 inline-flex rounded-full border border-border bg-card/90 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Wedding planning, made calm</span>
            <h1 className="max-w-4xl font-heading text-[42px] font-light leading-[1.08] tracking-tight sm:text-[58px] md:text-[66px]">Every function, every rupee.<br />One <span className="font-normal italic text-primary">calm</span> place.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-[17px]">Budget, functions, tasks, and guests in one simple workspace, so you can enjoy the wedding instead of fighting spreadsheets.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[10px] bg-primary px-6 text-sm font-medium text-background hover:bg-primary-hover" href="/register">Start planning, it’s free</Link>
              <a className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[10px] border border-border bg-card/90 px-6 text-sm font-medium text-foreground hover:border-primary" href="#how-it-works">See how it works</a>
            </div>
            <p className="mt-5 text-xs text-muted">Free to use · Made for Indian weddings · Indian number formatting</p>
            <div className="mt-14 w-full"><BudgetPreview /></div>
          </div>
        </section>

        <section aria-label="The problem with scattered wedding planning" className="border-b border-border bg-background px-5 py-16 text-center sm:px-8 sm:py-20">
          <p className="mx-auto max-w-4xl font-heading text-2xl font-light leading-relaxed text-muted sm:text-3xl">Notes in one app. <span className="mx-1 text-border">·</span> Numbers in a spreadsheet. <span className="mx-1 text-border">·</span> Plans buried in chats.</p>
          <div className="mx-auto my-7 h-px w-12 bg-border" />
          <h2 className="font-heading text-3xl font-light tracking-tight sm:text-4xl">Your wedding deserves one place.</h2>
        </section>

        <section aria-labelledby="dashboard-title" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28" id="dashboard">
          <div className="mb-10 max-w-2xl"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">The dashboard</p><h2 className="font-heading text-3xl font-light tracking-tight sm:text-4xl" id="dashboard-title">See the whole wedding at a glance.</h2><p className="mt-3 text-sm text-muted">One simple view for your budget, functions, and tasks.</p></div>
          <DashboardPreview />
        </section>

        <section aria-labelledby="features-title" className="border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28" id="features">
            <div className="mb-12 max-w-2xl"><h2 className="font-heading text-3xl font-light tracking-tight sm:text-4xl" id="features-title">Everything you need. Nothing you don’t.</h2><p className="mt-3 text-sm text-muted">Designed around the rhythm of Indian celebrations.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              {features.map((feature, index) => <article className={`${index === 0 ? "md:col-span-2 md:flex-row md:items-center md:justify-between" : "flex-col"} flex gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8`} key={feature.number}>
                <div className="max-w-xl"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{feature.number}</span><h3 className="mt-2 font-heading text-2xl font-light">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p></div>
                <div className={`w-full rounded-xl border border-border bg-background p-4 ${index === 0 ? "md:max-w-sm" : "mt-auto"}`}>{feature.preview}</div>
              </article>)}
            </div>
          </div>
        </section>

        <section aria-labelledby="budget-title" className="border-t border-border">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="mb-12 max-w-2xl"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Budget</p><h2 className="font-heading text-3xl font-light tracking-tight sm:text-4xl" id="budget-title">Know where every rupee went.</h2></div>
            <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-5">
                <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Total budget</p><p className="mt-2 font-heading text-3xl sm:text-4xl">₹15,00,000</p></div><div className="h-px bg-border" />
                <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Recorded expenses</p><p className="mt-2 font-heading text-3xl sm:text-4xl">₹9,42,000</p></div><div className="h-px bg-border" />
                <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Remaining budget</p><p className="mt-2 font-heading text-3xl text-primary sm:text-4xl">₹5,58,000</p></div>
              </div>
              <div className="flex flex-col gap-5 lg:col-span-7">
                <p className="text-sm leading-6 text-muted">See your remaining budget as you plan. If spending crosses the budget, the amount exceeded appears clearly. You can still record the expense.</p>
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-4"><span className="text-sm font-medium">Recent expenses</span><span className="whitespace-nowrap font-heading text-sm">Total: ₹9,42,000</span></div>
                  <div className="divide-y divide-border text-sm">
                    {[ ["Venue booking", "Venue", "₹4,50,000"], ["Catering advance", "Catering", "₹2,80,000"], ["Photography and video", "Photography", "₹1,20,000"], ["Stage and decoration setup", "Decoration", "₹65,000"], ["Wedding outfits", "Clothing and Jewellery", "₹27,000"] ].map(([name, category, amount]) => <div className="flex items-center justify-between gap-4 py-3.5" key={name}><div className="min-w-0"><p className="truncate">{name}</p><p className="mt-1 text-xs text-muted">{category}</p></div><span className="shrink-0 whitespace-nowrap font-heading text-base">{amount}</span></div>)}
                  </div>
                </div>
                <p className="flex items-center gap-2 rounded-xl border border-[#4A6074]/25 bg-[#4A6074]/5 p-4 text-sm text-[#4A6074]"><span aria-hidden="true" className="font-semibold">i</span>Example warning: Over budget by ₹50,000.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="together-title" className="border-t border-border bg-background" id="together">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="mb-12 max-w-2xl"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Together</p><h2 className="font-heading text-3xl font-light tracking-tight sm:text-4xl" id="together-title">Planned by the two of you.</h2><p className="mt-3 text-sm leading-6 text-muted">A calm shared plan for the details that make your celebration yours.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8"><div><span className="inline-flex rounded-md bg-[#9FB09A]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#536350]">Made for both partners</span><h3 className="mt-5 font-heading text-2xl font-light">Bride and groom</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted">Keep the budget, functions, tasks, and guest list together in one workspace.</p></div><div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-background p-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-sm text-background">A</span><span className="-ml-5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-[#536350] font-heading text-sm text-background">M</span><span className="text-sm font-medium">Aarav &amp; Meera</span></div></article>
              <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8"><div><span className="inline-flex rounded-md border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Simple by design</span><h3 className="mt-5 font-heading text-2xl font-light">Less scattered planning</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted">Use one clear list for the things to do, the people to invite, and the money to keep track of.</p></div><div className="mt-8 rounded-xl border border-border bg-background p-4"><p className="text-sm font-medium">Your wedding plan</p><p className="mt-1 text-xs text-muted">Functions · Tasks · Guests · Budget</p></div></article>
            </div>
          </div>
        </section>

        <section aria-labelledby="how-it-works-title" className="border-t border-border" id="how-it-works">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28"><div className="mb-12 max-w-2xl"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">How it works</p><h2 className="font-heading text-3xl font-light tracking-tight sm:text-4xl" id="how-it-works-title">Three steps. Then it’s all in one place.</h2></div>
            <div className="grid gap-8 md:grid-cols-3">{[["01", "Set up your wedding", "Add your wedding name, date, and total budget."], ["02", "Add the details", "Organize functions, expenses, tasks, and guests."], ["03", "Keep your plan close", "Come back to one clear view as the day gets closer."]].map(([number, title, description]) => <article className="flex flex-col gap-3 border-t border-border pt-5" key={number}><span className="font-heading text-3xl font-light">{number}</span><h3 className="font-heading text-xl">{title}</h3><p className="text-sm leading-6 text-muted">{description}</p></article>)}</div>
          </div>
        </section>

        <section className="bg-wine-deep px-5 py-20 text-center text-background sm:px-8 sm:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center"><h2 className="font-heading text-3xl font-light leading-tight text-background sm:text-5xl">Start planning your wedding today.</h2><p className="mt-4 text-sm text-background/75">Free to use.</p><Link className="mt-8 inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-[10px] bg-background px-7 text-sm font-medium text-wine-deep hover:bg-white" href="/register">Start planning, it’s free</Link></div>
        </section>
      </main>

      <footer className="bg-wine-anchor text-background/90">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-background/10 pb-7 sm:flex-row sm:items-center"><Link href="#top"><Brand light /></Link><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-background/70"><a className="hover:text-background" href="#features">Features</a><a className="hover:text-background" href="#how-it-works">How it works</a><Link className="hover:text-background" href="/login">Log in</Link><Link className="hover:text-background" href="/register">Sign up</Link></nav></div>
          <p className="pt-6 text-xs text-background/60">© Make My Marriage</p>
        </div>
      </footer>
    </div>
  );
}
