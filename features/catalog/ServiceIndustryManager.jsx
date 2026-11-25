"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "../../components/forms/RichTextEditor";

const definitions = {
  services: {
    title: "Services",
    endpoint: "services",
    arrayField: "capabilities",
    arrayLabel: "Capabilities / deliverables",
    icon: "◇",
  },
  industries: {
    title: "Industries",
    endpoint: "industries",
    arrayField: "channels",
    arrayLabel: "Marketing channels (one per line)",
    icon: "▥",
  },
};
const blank = (section) => ({
  title: "",
  slug: "",
  category: "",
  icon: "",
  summary: "",
  published: false,
  order: 0,
  ...(section === "services"
    ? { price: "", capabilities: [], image: "", content: "" }
    : { number: "", challenge: "", channels: [], samplePlan: "" }),
});
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ServiceIndustryManager({ section, request }) {
  const config = definitions[section];
  const [items, setItems] = useState([]);
  const [item, setItem] = useState(() => blank(section));
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const data = await request(`/${config.endpoint}/admin`);
    setItems(data.items || []);
  }, [config.endpoint, request]);
  useEffect(() => {
    refresh().catch((issue) => setError(issue.message));
  }, [refresh]);

  const visibleItems = useMemo(
    () =>
      items.filter((row) =>
        `${row.title} ${row.slug} ${row.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );
  const published = items.filter((row) => row.published).length;
  const drafts = items.length - published;
  function update(field, value) {
    setItem((current) => ({ ...current, [field]: value }));
  }
  function edit(row) {
    setItem({ ...blank(section), ...row });
    setError("");
    setNotice("");
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      ...item,
      [config.arrayField]:
        typeof item[config.arrayField] === "string"
          ? item[config.arrayField]
              .split("\n")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : item[config.arrayField],
    };
    try {
      const data = await request(
        `/${config.endpoint}${item._id ? `/${item._id}` : ""}`,
        { method: item._id ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setItem({ ...blank(section), ...data.item });
      await refresh();
      setNotice(`${config.title.slice(0, -1)} saved successfully.`);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !item._id ||
      !window.confirm(`Delete “${item.title}” from ${config.title}?`)
    )
      return;
    try {
      await request(`/${config.endpoint}/${item._id}`, { method: "DELETE" });
      setItem(blank(section));
      await refresh();
      setNotice("Record deleted from the CMS.");
    } catch (issue) {
      setError(issue.message);
    }
  }
  const arrayValue = Array.isArray(item[config.arrayField])
    ? item[config.arrayField].join("\n")
    : item[config.arrayField] || "";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {config.title} in CMS
          </p>
          <p className="mt-2 text-2xl font-bold">{items.length}</p>
          <p className="text-xs text-slate-500">
            Imported and uploaded records
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
            Published
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {published}
          </p>
          <p className="text-xs text-emerald-700">Visible on client site</p>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
            Drafts
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{drafts}</p>
          <p className="text-xs text-amber-700">Saved, not published</p>
        </article>
      </div>
      {(error || notice) && (
        <p
          className={`rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {error || notice}
        </p>
      )}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">{config.title} records</h2>
              <p className="text-xs text-slate-500">
                {visibleItems.length} shown
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setItem(blank(section));
                setError("");
                setNotice("");
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
            >
              ＋ New
            </button>
          </div>
          <input
            className={`${fieldClass} mb-3`}
            placeholder={`Search ${config.title.toLowerCase()}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-[68vh] space-y-1 overflow-auto">
            {visibleItems.map((row) => (
              <button
                type="button"
                key={row._id}
                onClick={() => edit(row)}
                className={`w-full rounded-xl px-3 py-3 text-left ${item._id === row._id ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-50"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {row.icon} {row.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {row.published ? "Live" : "Draft"}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {row.category} · /{config.endpoint}/{row.slug}
                </span>
              </button>
            ))}
            {!visibleItems.length && (
              <p className="px-2 py-6 text-center text-sm text-slate-400">
                No matching {config.title.toLowerCase()}.
              </p>
            )}
          </div>
        </aside>
        <form onSubmit={save} className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  {config.icon} Client page data
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {item._id
                    ? `Edit ${config.title.slice(0, -1)}`
                    : `Add ${config.title.slice(0, -1)}`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These fields are used by the client page cards and detail
                  page.
                </p>
              </div>
              <label className="!mb-0 flex items-center gap-2">
                <input
                  className="size-4 !w-4"
                  type="checkbox"
                  checked={item.published === true}
                  onChange={(event) =>
                    update("published", event.target.checked)
                  }
                />
                Published
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label>Title</label>
                <input
                  required
                  maxLength={180}
                  className={fieldClass}
                  value={item.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </div>
              <div>
                <label>URL slug</label>
                <input
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className={fieldClass}
                  value={item.slug}
                  onChange={(event) => update("slug", event.target.value)}
                  placeholder="my-service-or-industry"
                />
              </div>
              <div>
                <label>Category</label>
                <input
                  className={fieldClass}
                  value={item.category || ""}
                  onChange={(event) => update("category", event.target.value)}
                />
              </div>
              <div>
                <label>Card icon (emoji or symbol)</label>
                <input
                  className={fieldClass}
                  maxLength={40}
                  value={item.icon || ""}
                  onChange={(event) => update("icon", event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label>Card summary</label>
                <textarea
                  className={fieldClass}
                  rows={3}
                  maxLength={1000}
                  value={item.summary || ""}
                  onChange={(event) => update("summary", event.target.value)}
                />
              </div>
              {section === "services" ? (
                <>
                  <div>
                    <label>Price / starting price</label>
                    <input
                      className={fieldClass}
                      maxLength={120}
                      value={item.price || ""}
                      onChange={(event) => update("price", event.target.value)}
                    />
                  </div>
                  <div>
                    <label>Display order</label>
                    <input
                      className={fieldClass}
                      type="number"
                      value={item.order || 0}
                      onChange={(event) =>
                        update("order", Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>{config.arrayLabel}</label>
                    <textarea
                      className={fieldClass}
                      rows={5}
                      placeholder="One capability per line"
                      value={arrayValue}
                      onChange={(event) =>
                        update(config.arrayField, event.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <ImageUploadField
                      label="Service Open Graph image"
                      purpose={`Used as the social sharing preview image for ${item.title || "this service"} (/services/${item.slug || "[slug]"}). For an image inside the page text, use the inline Image button below.`}
                      value={item.image || ""}
                      onChange={(url) => update("image", url)}
                      request={request}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label>Full page description</label>
                    <RichTextEditor
                      value={item.content || ""}
                      onChange={(html) => update("content", html)}
                      request={request}
                      imagePurpose={`inline in the full page description for ${item.title || "this service"} (/services/${item.slug || "[slug]"})`}
                    />
                    <p className="text-xs text-slate-500">
                      Use headings, paragraphs, lists, links, and inline images
                      for this service page.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label>Card number</label>
                    <input
                      className={fieldClass}
                      maxLength={8}
                      value={item.number || ""}
                      onChange={(event) => update("number", event.target.value)}
                    />
                  </div>
                  <div>
                    <label>Display order</label>
                    <input
                      className={fieldClass}
                      type="number"
                      value={item.order || 0}
                      onChange={(event) =>
                        update("order", Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Industry challenge</label>
                    <textarea
                      className={fieldClass}
                      rows={3}
                      maxLength={3000}
                      value={item.challenge || ""}
                      onChange={(event) =>
                        update("challenge", event.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>{config.arrayLabel}</label>
                    <textarea
                      className={fieldClass}
                      rows={5}
                      placeholder="One channel per line"
                      value={arrayValue}
                      onChange={(event) =>
                        update(config.arrayField, event.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Sample growth plan</label>
                    <textarea
                      className={fieldClass}
                      rows={4}
                      maxLength={3000}
                      value={item.samplePlan || ""}
                      onChange={(event) =>
                        update("samplePlan", event.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </section>
          <div className="sticky bottom-0 flex justify-between border-t border-slate-200 bg-[#f5f7fb]/95 py-4 backdrop-blur">
            <div>
              {item._id && (
                <button
                  type="button"
                  onClick={remove}
                  className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  Delete
                </button>
              )}
            </div>
            <button
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : item._id ? "Save changes" : "Create record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
