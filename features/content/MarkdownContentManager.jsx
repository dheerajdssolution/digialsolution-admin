"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";
import FieldEditor from "../../components/forms/FieldEditor";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const humanize = (value) =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const copy = (value) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export default function MarkdownContentManager() {
  const { request } = useAdminAuth();
  const [collections, setCollections] = useState([]);
  const [entries, setEntries] = useState([]);
  const [collection, setCollection] = useState("");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const result = await request(
      `/content/admin${collection ? `?collection=${encodeURIComponent(collection)}` : ""}`,
    );
    setCollections(result.collections || []);
    setEntries(result.entries || []);
    if (!collection && result.collections?.length)
      setCollection(result.collections[0]);
  }, [collection, request]);
  useEffect(() => {
    refresh().catch((issue) => setError(issue.message));
  }, [refresh]);

  const collectionEntries = useMemo(
    () => entries.filter((entry) => entry.collection === collection),
    [collection, entries],
  );
  const visibleEntries = useMemo(
    () =>
      collectionEntries.filter((entry) =>
        `${entry.title} ${entry.slug}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [collectionEntries, search],
  );

  function create() {
    setSelected({
      collection,
      slug: "new-page",
      title: "New page",
      data: { title: "New page", meta_title: "", description: "", draft: true },
      body: "",
      published: false,
      order: collectionEntries.length,
    });
    setError("");
    setNotice("");
  }
  function edit(entry) {
    setSelected(copy(entry));
    setError("");
    setNotice("");
  }
  function updateData(data) {
    setSelected((current) => ({
      ...current,
      data,
      title: String(data.title || data.meta_title || current.slug),
    }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      ...selected,
      data: { ...selected.data, draft: !selected.published },
    };
    try {
      const result = await request("/content/admin", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSelected(result.entry);
      await refresh();
      setNotice(
        "Content saved; published entries are available to the client.",
      );
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
        `Delete “${selected.title || selected.slug}” from ${collection}?`,
      )
    )
      return;
    try {
      await request(`/content/admin/${selected._id}`, { method: "DELETE" });
      setSelected(null);
      await refresh();
      setNotice("Markdown content deleted.");
    } catch (issue) {
      setError(issue.message);
    }
  }

  const publishedCount = collectionEntries.filter(
    (entry) => entry.published,
  ).length;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">
          Markdown content
        </p>
        <h1 className="mt-1 text-3xl font-bold">Content Library</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Edit the frontmatter fields and Markdown body from the files in
          client/src/content. The form follows each file’s actual nested
          structure.
        </p>
      </header>
      {(error || notice) && (
        <p
          className={`rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {error || notice}
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <label>Content collection</label>
            <select
              className={fieldClass}
              value={collection}
              onChange={(event) => {
                setCollection(event.target.value);
                setSelected(null);
                setSearch("");
              }}
            >
              <option value="" disabled>
                Select a collection
              </option>
              {collections.map((name) => (
                <option value={name} key={name}>
                  {humanize(name)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {collectionEntries.length} records · {publishedCount} published ·{" "}
              {collectionEntries.length - publishedCount} drafts
            </p>
          </div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold">
              {collection ? humanize(collection) : "Entries"}
            </h2>
            <button
              type="button"
              disabled={!collection}
              onClick={create}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              ＋ New
            </button>
          </div>
          <input
            className={`${fieldClass} mb-3`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search entries"
          />
          <div className="max-h-[65vh] space-y-1 overflow-auto">
            {visibleEntries.map((entry) => (
              <button
                type="button"
                key={entry._id}
                onClick={() => edit(entry)}
                className={`w-full rounded-xl px-3 py-3 text-left ${selected?._id === entry._id ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-50"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {entry.title || entry.slug}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${entry.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {entry.published ? "Live" : "Draft"}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {entry.slug}
                </span>
              </button>
            ))}
            {!visibleEntries.length && (
              <p className="px-2 py-5 text-sm text-slate-400">
                No entries found in this collection.
              </p>
            )}
          </div>
        </aside>
        {selected ? (
          <form onSubmit={save} className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
                    {humanize(collection)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {selected._id ? "Edit content" : "Create content"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Page data is stored as structured frontmatter and rendered
                    content stays in Markdown.
                  </p>
                </div>
                <label className="!mb-0 flex items-center gap-2">
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
                <div>
                  <label>Entry slug</label>
                  <input
                    required
                    className={fieldClass}
                    readOnly={selected.slug === "-index"}
                    value={selected.slug}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        slug: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-"),
                      }))
                    }
                  />
                </div>
                <div>
                  <label>Display title</label>
                  <input
                    className={fieldClass}
                    value={
                      selected.data.title ||
                      selected.data.meta_title ||
                      selected.title ||
                      ""
                    }
                    onChange={(event) =>
                      updateData({
                        ...selected.data,
                        title: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </section>
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold">Frontmatter fields</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Generated from this Markdown file’s YAML fields. Nested lists
                  and objects can be edited too.
                </p>
              </div>
              <FieldEditor
                name="Page fields"
                value={selected.data}
                onChange={updateData}
              />
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <label>Markdown body</label>
              <textarea
                className={`${fieldClass} mt-2 font-mono text-xs leading-6`}
                rows={18}
                value={selected.body || ""}
                onChange={(event) =>
                  setSelected((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
                placeholder="Write Markdown content…"
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
                    Delete entry
                  </button>
                )}
              </div>
              <button
                disabled={busy}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save content"}
              </button>
            </div>
          </form>
        ) : (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Select a Markdown entry or create a new one.
          </section>
        )}
      </div>
    </div>
  );
}
