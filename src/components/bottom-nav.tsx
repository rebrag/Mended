"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const icons: Record<string, ReactNode> = {
  home: (
    <svg {...iconProps}>
      <path d="M4 20V10.5a8 8 0 0 1 16 0V20" />
      <path d="M3 20h18" />
      <path d="M9.5 20v-5a2.5 2.5 0 0 1 5 0v5" />
    </svg>
  ),
  moment: (
    <svg {...iconProps}>
      <path d="M9.5 3.5h5v2l-1 .6v2.2c3.4 1.2 5.5 3.9 5.5 7.4 0 3.5-3 5.8-7 5.8s-7-2.3-7-5.8c0-3.5 2.1-6.2 5.5-7.4V6.1l-1-.6z" />
      <path d="M7.5 13.5l3 1.5 1.5-2 2 2.5 2-1" />
    </svg>
  ),
  tree: (
    <svg {...iconProps}>
      <path d="M12 21v-7" />
      <path d="M12 14c-3.5 0-6-2.2-6-5.2C6 5.6 8.7 3 12 3s6 2.6 6 5.8c0 3-2.5 5.2-6 5.2z" />
      <circle cx="14.5" cy="9.5" r="1.6" />
      <path d="M8 21h8" />
    </svg>
  ),
  album: (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M3.5 15.5l4.5-4.5 4 4 3-3 5.5 5.5" />
      <circle cx="15.5" cy="9" r="1.5" />
    </svg>
  ),
};

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/moment", label: "Today", icon: "moment" },
  { href: "/tree", label: "Tree", icon: "tree" },
  { href: "/album", label: "Album", icon: "album" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold tracking-wide transition-colors",
                  active ? "text-primary" : "text-ink-faint hover:text-ink-soft",
                )}
              >
                {icons[tab.icon]}
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
