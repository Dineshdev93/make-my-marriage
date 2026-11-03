import type { SVGProps } from "react";

export type IconName =
  | "dashboard" | "wallet" | "calendar" | "tasks" | "guests" | "rsvp" | "mail" | "photos" | "settings"
  | "chevron-left" | "chevron-right" | "chevron-down" | "menu" | "close" | "user" | "plus" | "edit" | "trash" | "more" | "info" | "check";

const paths: Record<IconName, string> = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  wallet: "M3 6.5A2.5 2.5 0 015.5 4H20v15H5.5A2.5 2.5 0 013 16.5zM3 7h17M16 12h4",
  calendar: "M4 5h16v16H4zM8 3v4M16 3v4M4 10h16",
  tasks: "M8 5h12M8 12h12M8 19h12M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2",
  guests: "M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM17 11a4 4 0 000-8M17 15h1a4 4 0 014 4v2",
  rsvp: "M4 4h16v12H8l-4 4zM8 9l3 3 5-5",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  photos: "M4 4h16v13H4zM2 8v13h16M8 14l3-3 5 5M15 8h.01",
  settings: "M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M10 16v4",
  "chevron-left": "M14 5l-7 7 7 7",
  "chevron-right": "M10 5l7 7-7 7",
  "chevron-down": "M5 9l7 7 7-7",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M5 5l14 14M19 5L5 19",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  plus: "M12 5v14M5 12h14",
  edit: "M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  info: "M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  check: "M5 12l4 4L19 6",
};

export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}>
      {name === "check" || name === "edit" ? <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /> : <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />}
    </svg>
  );
}
