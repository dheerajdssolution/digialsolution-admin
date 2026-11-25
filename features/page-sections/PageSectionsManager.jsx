"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";
import FieldEditor from "../../components/forms/FieldEditor";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const copy = (value) => JSON.parse(JSON.stringify(value));
const nice = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function PageSectionsManager({ page }) {
  const { request } = useAdminAuth();
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pageTitle =
    {
      home: "Home page",
      about: "About page",
      pricing: "Pricing page",
      smm: "SMM plans",
      founder: "Founder story",
    }[page] || "Page sections";
  const previewPath = {
    home: "/",
    about: "/about-us",
    pricing: "/pricing",
    smm: "/smm",
  }[page];

  const refresh = useCallback(async () => {
    const result = await request(`/page-sections/admin?page=${page}`);
    setSections(result.sections || []);
  }, [page, request]);
  useEffect(() => {
    refresh().catch((issue) => setError(issue.message));
  }, [refresh]);

  const counts = useMemo(
    () => ({
      live: sections.filter((section) => section.published).length,
      drafts: sections.filter((section) => !section.published).length,
    }),
    [sections],
  );
  function createSection() {
    const key = `new-section-${sections.length + 1}`;
    setSelected({
      page,
      sectionKey: key,
      title: "New section",
      data: { title: "New section", content: "" },
      published: false,
      order: sections.length,
    });
    setError("");
    setNotice("");
  }
  function editSection(section) {
    setSelected(copy(section));
    setError("");
    setNotice("");
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const endpoint = selected._id
      ? `/page-sections/admin/${selected._id}`
      : "/page-sections/admin";
    try {
      const result = await request(endpoint, {
        method: selected._id ? "PUT" : "POST",
        body: JSON.stringify(selected),
      });
      setSelected(result.section);
      await refresh();
      setNotice(`${pageTitle} section saved in the admin CMS.`);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !selected?._id ||
      !window.confirm(
        `Delete the “${selected.title}” section from ${pageTitle}?`,
      )
    )
      return;
    try {
      await request(`/page-sections/admin/${selected._id}`, {
        method: "DELETE",
      });
      setSelected(null);
      await refresh();
      setNotice("Section deleted.");
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Section management
          </p>
          <h1 className="mt-1 text-3xl font-bold">{pageTitle} sections</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Manage each section separately. Edit nested content such as plan
            prices, descriptions, feature lists, founder profile, headings and
            buttons; save drafts or publish sections.
          </p>
        </div>
        {previewPath && (
          <a
            href={`${(process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com").replace(/\/$/, "")}${previewPath}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
          >
            Preview page ↗
          </a>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total sections</p>
          <p className="mt-1 text-2xl font-bold">{sections.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {counts.live}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Drafts</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {counts.drafts}
          </p>
        </article>
      </div>
      {(error || notice) && (
        <p
          className={`rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {error || notice}
        </p>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.5fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Page sections</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a section to edit its fields.
              </p>
            </div>
            <button
              type="button"
              onClick={createSection}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
            >
              ＋ Add section
            </button>
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section._id}
                type="button"
                onClick={() => editSection(section)}
                className={`w-full rounded-xl border p-3 text-left transition ${selected?._id === section._id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {section.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${section.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {section.published ? "Published" : "Draft"}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {section.sectionKey}
                </span>
              </button>
            ))}
            {!sections.length && (
              <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
                No sections yet. Add the first section to begin.
              </p>
            )}
          </div>
        </aside>
        {selected ? (
          <form onSubmit={save} className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
                    {nice(page)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {selected._id ? "Edit section" : "Add section"}
                  </h2>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={selected.published === true}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        published: event.target.checked,
                      }))
                    }
                    className="size-4 rounded border-slate-300 text-indigo-600"
                  />
                  Published
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Section key
                  <input
                    required
                    className={inputClass}
                    value={selected.sectionKey || ""}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        sectionKey: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, "-"),
                      }))
                    }
                    placeholder="example: pricing-plans"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Section name
                  <input
                    required
                    className={inputClass}
                    value={selected.title || ""}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Pricing plans"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Display order
                  <input
                    className={inputClass}
                    type="number"
                    value={selected.order ?? 0}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        order: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>
            </section>
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold">Section fields</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add or remove repeated cards and edit their nested values.
                  This works for pricing cards, plan features and other page
                  sections.
                </p>
              </div>
              <FieldEditor
                name={selected.sectionKey || "Section content"}
                value={selected.data || {}}
                onChange={(data) =>
                  setSelected((current) => ({ ...current, data }))
                }
              />
            </section>
            <div className="sticky bottom-0 flex justify-between border-t border-slate-200 bg-[#f5f7fb]/95 py-4 backdrop-blur">
              <div>
                {selected._id && (
                  <button
                    type="button"
                    onClick={remove}
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    Delete section
                  </button>
                )}
              </div>
              <button
                disabled={busy}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save section"}
              </button>
            </div>
          </form>
        ) : (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Select a section or add a new one.
          </section>
        )}
      </div>
    </div>
  );
}
