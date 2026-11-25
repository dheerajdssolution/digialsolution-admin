"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/home-content", path: "/", label: "Home", icon: "⌂" },
  { href: "/about-content", path: "/about-us", label: "About", icon: "◉" },
  { href: "/pricing-content", path: "/pricing", label: "Pricing", icon: "＄" },
  {
    href: "/website-update?path=%2Fservices&mode=items",
    path: "/services",
    label: "Services",
    icon: "◇",
  },
  {
    href: "/website-update?path=%2Findustries&mode=items",
    path: "/industries",
    label: "Industries",
    icon: "▥",
  },
  {
    href: "/website-update?path=%2Flegal&mode=page",
    path: "/legal",
    label: "Legal",
    icon: "§",
  },
  {
    href: "/website-update?path=%2Four-portfolio&mode=items",
    path: "/our-portfolio",
    label: "Our Work",
    icon: "▧",
  },
  {
    href: "/website-update?path=%2Fblog&mode=items",
    path: "/blog",
    label: "Blog",
    icon: "✎",
  },
  { href: "/smm-content", path: "/smm", label: "SMM Plans", icon: "◎" },
  {
    href: "/website-update?path=%2Fcontact&mode=page",
    path: "/contact",
    label: "Contact",
    icon: "✉",
  },
];

export default function Sidebar({ onLogout }) {
  const pathname = usePathname();
  const [selectedPage, setSelectedPage] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedPage(params.get("path") || "");
  }, [pathname]);
  return (
    <aside className="flex min-h-[calc(100vh-2.5rem)] flex-col rounded-2xl bg-[#11182f] p-4 text-white shadow-xl shadow-slate-900/10 md:sticky md:top-5">
      <div className="mb-6 rounded-xl bg-white p-2.5">
        <img
          src="/ds-solution-logo.png"
          alt="DS Solution"
          className="h-auto w-full"
        />
      </div>
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`mb-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${pathname === "/" ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
      >
        <span className="grid size-6 place-items-center text-lg">▦</span>
        Dashboard
      </Link>
      <p className="mb-3 px-3 text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
        Client pages
      </p>
      <nav className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
        {navigation.map(({ href, path, label, icon }) => {
          const sectionRoute = {
            "/": "/home-content",
            "/about-us": "/about-content",
            "/pricing": "/pricing-content",
            "/smm": "/smm-content",
          }[path];
          const active = sectionRoute
            ? pathname === sectionRoute
            : pathname.startsWith("/website-update") && selectedPage === path;
          return (
            <a
              key={path}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="grid size-6 shrink-0 place-items-center text-lg">
                {icon}
              </span>
              <span>{label}</span>
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-white" />
              )}
            </a>
          );
        })}
      </nav>
      <p className="mt-6 mb-3 border-t border-white/10 px-3 pt-5 text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
        Site settings
      </p>
      <Link
        href="/founder-content"
        className={`mx-4 mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${pathname === "/founder-content" ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
      >
        <span>✦</span>
        <span>Founder Story</span>
      </Link>
      <Link
        href="/seo"
        aria-current={pathname === "/seo" ? "page" : undefined}
        className={`mx-4 mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${pathname === "/seo" ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
      >
        <span>⌕</span>
        <span>SEO Management</span>
      </Link>
      <nav className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
        {[
          ["/content-library", "Content Library", "▤"],
          ["/contact-messages", "Contact Messages", "✉"],
          ["/footer", "Footer", "▱"],
        ].map(([href, label, icon]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="grid size-6 place-items-center text-lg">
                {icon}
              </span>
              <span>{label}</span>
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 hover:text-white"
        >
          <span className="grid size-6 place-items-center text-lg">↪</span>
          Logout
        </button>
        <p className="px-3 pt-3 text-xs text-slate-500">DS Solution · Admin</p>
      </div>
    </aside>
  );
}
