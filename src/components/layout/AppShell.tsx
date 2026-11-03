"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import type { WeddingRecord } from "@/modules/wedding/service";

interface AppShellProps {
  children: ReactNode;
  userName: string;
  wedding: WeddingRecord;
}

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const weddingItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/expenses", label: "Budget and Expenses", icon: "wallet" },
  { href: "/functions", label: "Functions", icon: "calendar" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/guests", label: "Guests", icon: "guests" },
];

const comingSoonItems: { label: string; icon: IconName }[] = [
  { label: "RSVP", icon: "rsvp" },
  { label: "Invitations", icon: "mail" },
  { label: "Photo gallery", icon: "photos" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/expenses": "Budget and Expenses",
  "/functions": "Functions",
  "/tasks": "Tasks",
  "/guests": "Guests",
  "/settings": "Wedding Settings",
};

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-2"}`}>
      <svg aria-hidden="true" className="h-7 w-9 shrink-0 text-primary" viewBox="0 0 40 28" fill="none">
        <circle cx="15" cy="14" r="10" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="25" cy="14" r="10" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {!collapsed ? <span className="hidden whitespace-nowrap font-heading text-lg tracking-tight lg:inline">Make My Marriage</span> : null}
    </div>
  );
}

function SidebarContent({ collapsed, mobile, pathname, onCollapse, onNavigate }: {
  collapsed: boolean;
  mobile: boolean;
  pathname: string;
  onCollapse: () => void;
  onNavigate: () => void;
}) {
  const labelClass = collapsed ? "hidden" : "hidden lg:inline";
  const groupClass = collapsed ? "hidden" : "mb-1 hidden px-2 pt-6 text-[11px] font-semibold uppercase tracking-widest text-muted lg:block";

  function renderLink(item: NavItem) {
    const active = pathname === item.href;
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`relative flex min-h-11 min-w-0 items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "border-l-[3px] border-primary bg-[#EFE8DF] font-medium text-primary" : "border-l-[3px] border-transparent text-muted hover:bg-background hover:text-foreground"} ${collapsed ? "justify-center px-0" : ""}`}
        href={item.href}
        key={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="shrink-0" name={item.icon} size={20} />
        <span className={`min-w-0 truncate ${labelClass}`}>{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      <header className={`relative flex h-20 shrink-0 items-center border-b border-border/70 px-5 ${collapsed ? "justify-center" : "justify-between"}`}>
        <Logo collapsed={collapsed} />
        {mobile ? (
          <button aria-label="Close navigation" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background" onClick={onNavigate} type="button"><Icon name="close" /></button>
        ) : (
          <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted shadow-sm hover:text-primary lg:inline-flex" onClick={onCollapse} type="button">
            <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={16} />
          </button>
        )}
      </header>
      <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-5">
        <p className={groupClass}>Wedding</p>
        <div className="flex flex-col gap-1">{weddingItems.map(renderLink)}</div>

        <p className={groupClass}>Coming soon</p>
        <div className="mt-1 flex flex-col gap-1">
          {comingSoonItems.map((item) => (
            <div className={`flex min-h-10 min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm text-muted/70 ${collapsed ? "justify-center px-0" : ""}`} key={item.label} title={collapsed ? `${item.label} — soon` : undefined}>
              <span className="flex min-w-0 items-center gap-3"><Icon className="shrink-0" name={item.icon} size={20} /><span className={`truncate ${labelClass}`}>{item.label}</span></span>
              {!collapsed ? <Pill className="hidden px-2 py-0.5 text-[10px] lg:inline-flex">Soon</Pill> : null}
            </div>
          ))}
        </div>

        <p className={groupClass}>Settings</p>
        <div className="mt-1 flex flex-col gap-1">
          {renderLink({ href: "/settings", label: "Wedding Settings", icon: "settings" })}
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children, userName, wedding }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = pageTitles[pathname] ?? "Make My Marriage";
  const desktopOffset = collapsed ? "md:left-[72px]" : "md:left-[72px] lg:left-[260px]";
  const contentOffset = collapsed ? "md:pl-[72px]" : "md:pl-[72px] lg:pl-[260px]";

  return (
    <div className="min-h-screen" data-wedding-name={wedding.name}>
      <aside aria-label={`Navigation for ${wedding.name}`} className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card select-none md:flex ${collapsed ? "w-[72px]" : "w-[72px] lg:w-[260px]"}`}>
        <SidebarContent collapsed={collapsed} mobile={false} onCollapse={() => setCollapsed((value) => !value)} onNavigate={() => undefined} pathname={pathname} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-foreground/25 md:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
          <aside aria-label={`Navigation for ${wedding.name}`} className="flex h-full w-[min(300px,86vw)] flex-col border-r border-border bg-card shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <SidebarContent collapsed={false} mobile onCollapse={() => undefined} onNavigate={() => setMobileOpen(false)} pathname={pathname} />
          </aside>
        </div>
      ) : null}

      <div className={contentOffset}>
        <header className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 md:h-20 ${desktopOffset}`}>
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Open navigation" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-card md:hidden" onClick={() => setMobileOpen(true)} type="button"><Icon name="menu" /></button>
            <h1 className="truncate font-heading text-xl tracking-tight sm:text-2xl">{title}</h1>
          </div>
          <details className="relative ml-3 shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-card sm:gap-3">
              <span className="hidden text-right sm:flex sm:flex-col"><span className="text-sm font-medium leading-5 text-foreground">{userName}</span><span className="text-xs leading-4 text-muted">Editor</span></span>
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-heading text-lg text-background">{userName.trim().charAt(0).toLocaleUpperCase() || "E"}</span>
              <Icon className="text-muted" name="chevron-down" size={16} />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card p-3 shadow-lg">
              <p className="mb-3 truncate px-2 text-sm text-muted">{userName}</p>
              <SignOutButton />
            </div>
          </details>
        </header>
        <main className="min-h-screen px-4 pb-10 pt-20 sm:px-6 md:pt-24 lg:px-8">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
