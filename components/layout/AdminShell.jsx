"use client";

import LoginScreen from "../auth/LoginScreen";
import { useAdminAuth } from "../auth/AdminAuthProvider";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

const CLIENT_SITE = (
  process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com"
).replace(/\/$/, "");

export default function AdminShell({ children }) {
  const { token, email, ready, logout } = useAdminAuth();
  const pathname = usePathname();
  if (!ready)
    return (
      <main className="grid min-h-screen place-items-center text-sm text-slate-500">
        Loading admin workspace…
      </main>
    );
  if (!token) return <LoginScreen />;
  const topNavigation = [
    ["/", "Dashboard"],
    ["/seo", "SEO Dashboard"],
    ["/website-update", "Website Update"],
  ];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div>
            <h1 className="font-bold text-slate-900">DS Solution Admin</h1>
            <p className="text-xs text-slate-500">
              Content management workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 xl:block">
              Signed in as {email || "administrator"}
            </span>
            <a
              href={CLIENT_SITE}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
            >
              View client site ↗
            </a>
          </div>
        </div>
        <nav
          aria-label="Admin sections"
          className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-5 pb-2"
        >
          {topNavigation.map(([href, label]) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <a
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 md:grid-cols-[250px_minmax(0,1fr)] xl:px-6">
        <Sidebar onLogout={logout} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
