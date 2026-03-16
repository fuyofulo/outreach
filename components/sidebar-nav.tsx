"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/threads", label: "Threads" },
  { href: "/contacts", label: "Contacts" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="retro-pattern h-full border-b border-white/20 bg-[linear-gradient(180deg,#1f4ec2_0%,#184099_30%,#14316f_100%)] p-3 lg:border-b-0 lg:border-r lg:border-r-white/15 lg:p-4">
      <div className="retro-window overflow-hidden">
        <div className="retro-titlebar px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]">
          Navigation Console
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div>
              <Link
                href="/"
                className="mt-2 block font-[Trebuchet_MS] text-4xl font-black tracking-[-0.08em] text-[#12306d]"
              >
                Outreach Desk
              </Link>
            </div>

            <Link href="/threads/new" className="button-primary text-sm lg:mt-6">
              New thread
            </Link>
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition-all ${
                    isActive
                      ? "border-[#5f74b2] border-t-white border-l-white border-r-[#485d95] border-b-[#485d95] bg-[linear-gradient(180deg,#ff79d8_0%,#ff48c4_48%,#d62f96_100%)] text-white shadow-[2px_2px_0_rgba(17,34,76,0.14)]"
                      : "border-[#6c83ba] border-t-white border-l-white border-r-[#4e6393] border-b-[#4e6393] bg-[linear-gradient(180deg,#ffffff_0%,#d9e6ff_56%,#c7d4f0_100%)] text-[#17356e] shadow-[2px_2px_0_rgba(17,34,76,0.12)] hover:translate-y-[-1px]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
