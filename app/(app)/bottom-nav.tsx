"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Carrot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/pantry", label: "Pantry", icon: Carrot },
  { href: "/suggest", label: "Suggest", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/onboarding")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex h-16 items-stretch">
        {LINKS.map((link) => {
          const active =
            pathname === link.href ||
            pathname?.startsWith(`${link.href}/`) ||
            (link.href === "/suggest" && pathname?.startsWith("/recipes"));
          const Icon = link.icon;
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                prefetch
                className={cn(
                  "flex h-full select-none flex-col items-center justify-center gap-1 text-xs transition-colors duration-150 ease-out active:bg-accent/50",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-150 ease-out",
                    active && "scale-110 fill-primary/10",
                  )}
                />
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
