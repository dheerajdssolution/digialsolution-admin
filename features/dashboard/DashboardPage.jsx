"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { headerPages } from "../../config/headerPages";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";

export default function DashboardPage() {
  const { request, email } = useAdminAuth();
  const [pages, setPages] = useState([]);
  const [counts, setCounts] = useState({
    services: 0,
    industries: 0,
    blog: 0,
    portfolio: 0,
    markdown: 0,
  });
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      request("/pages/admin"),
      request("/services/admin"),
      request("/industries/admin"),
      request("/blog/admin"),
      request("/portfolio/admin"),
      request("/content/admin"),
      request("/footer/admin"),
    ])
      .then(([pageData, services, industries, blog, portfolio, markdown]) => {
        setPages(pageData.pages || []);
        setCounts({
          services: services.items?.length || 0,
          industries: industries.items?.length || 0,
          blog: blog.items?.length || 0,
          portfolio: portfolio.items?.length || 0,
          markdown: markdown.entries?.length || 0,
        });
      })
      .catch((issue) => setError(issue.message));
  }, [request]);
  const updatedPages = pages.filter((page) => page._id).length;
  const drafts = pages.filter((page) => page._id && !page.published).length;
  const recordsByPath = new Map(pages.map((page) => [page.path, page]));
  const stats = [
    ["Active header pages", headerPages.length, "Available to manage"],
    ["Updated pages", updatedPages, "Content saved in CMS"],
    ["Draft pages", drafts, "Not visible to visitors"],
    ["Services", counts.services, "Published and draft items"],
    ["Industries", counts.industries, "Published and draft items"],
    ["Blog posts", counts.blog, "Published and draft items"],
    ["Portfolio projects", counts.portfolio, "Published and draft items"],
    ["Markdown records", counts.markdown, "Frontmatter and body content"],
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Content workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            Welcome{email ? `, ${email}` : ""}. Manage search visibility and
            publish client website content.
          </p>
        </div>
        <a
          href={(
            process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com"
          ).replace(/\/$/, "")}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        >
          Open client site ↗
        </a>
      </header>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value, caption]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{caption}</p>
          </article>
        ))}
      </div>
      <section className="grid gap-5 lg:grid-cols-2">
        <Link
          href="/seo"
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-900/5"
        >
          <span className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
            ⌕
          </span>
          <h2 className="mt-5 text-xl font-bold">SEO Management</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage titles, descriptions, canonical URLs, keywords and social
            previews for every active client header page.
          </p>
          <span className="mt-5 inline-block text-sm font-semibold text-indigo-700">
            Open SEO section →
          </span>
        </Link>
        <Link
          href="/website-update"
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-900/5"
        >
          <span className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
            ▧
          </span>
          <h2 className="mt-5 text-xl font-bold">Website Update</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use a sidebar page link or the Dashboard page overview to add, edit,
            publish and delete website content.
          </p>
          <span className="mt-5 inline-block text-sm font-semibold text-indigo-700">
            Open website update →
          </span>
        </Link>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-bold">Active client pages</h2>
          <p className="mt-1 text-sm text-slate-500">
            {headerPages.length} header links · choose a card to manage
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {headerPages.map((item) => {
            const record = recordsByPath.get(item.path);
            const catalogKey = {
              servicesContent: "services",
              industriesContent: "industries",
              blogContent: "blog",
              portfolioContent: "portfolio",
            }[item.catalog];
            const count = catalogKey ? counts[catalogKey] : null;
            const mode = item.catalog ? "items" : "page";
            return (
              <Link
                key={item.path}
                href={`/website-update?path=${encodeURIComponent(item.path)}&mode=${mode}`}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-lg text-indigo-700">
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {item.label}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {item.path}
                    </span>
                  </span>
                </span>
                <span className="mt-3 flex items-center justify-between text-xs">
                  <span
                    className={`rounded-full px-2.5 py-1 font-medium ${record?._id ? (record.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700") : "bg-slate-100 text-slate-600"}`}
                  >
                    {record?._id
                      ? record.published
                        ? "Published"
                        : "Draft"
                      : "Manage page"}
                  </span>
                  {count !== null && (
                    <span className="text-slate-500">{count} items</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
