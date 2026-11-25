"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "../../components/forms/RichTextEditor";

const definitions = {
  servicesContent: {
    endpoint: "services",
    title: "Services",
    fields: ["summary", "content", "image", "price"],
  },
  blogContent: {
    endpoint: "blog",
    title: "Blog posts",
    fields: ["summary", "content", "image", "author"],
  },
  portfolioContent: {
    endpoint: "portfolio",
    title: "Portfolio projects",
    fields: ["summary", "content", "image", "client"],
  },
  testimonialsContent: {
    endpoint: "testimonials",
    title: "Testimonials",
    fields: ["quote", "author", "company", "image"],
  },
};
const CLIENT_SITE = (
  process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com"
).replace(/\/$/, "");
const labels = {
  summary: "Summary",
  content: "Full content",
  price: "Price",
  author: "Author",
  client: "Client",
  quote: "Testimonial quote",
  company: "Company",
};
const imageFieldInfo = {
  servicesContent: {
    label: "Service Open Graph image",
    purpose: "Used as the social sharing preview image for this service page.",
  },
  blogContent: {
    label: "Blog featured image",
    purpose: "Shown as the featured image on the blog card and article page.",
  },
  portfolioContent: {
    label: "Portfolio project cover image",
    purpose: "Shown as the cover or thumbnail for this portfolio project.",
  },
  testimonialsContent: {
    label: "Testimonial author photo",
    purpose: "Shown beside this testimonial quote in testimonial sections.",
  },
};
const blank = (author = "") => ({
  title: "",
  slug: "",
  summary: "",
  content: "",
  image: "",
  price: "",
  author,
  client: "",
  quote: "",
  company: "",
  published: false,
  order: 0,
});

export default function ContentManager({ section, request }) {
  const config = definitions[section];
  const defaultAuthor = config.endpoint === "blog" ? "Admin" : "";
  const [items, setItems] = useState([]);
  const [item, setItem] = useState(() => blank(defaultAuthor));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const data = await request(`/${config.endpoint}/admin`);
    setItems(data.items || []);
  }, [config.endpoint, request]);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await request(
        `/${config.endpoint}${item._id ? `/${item._id}` : ""}`,
        { method: item._id ? "PUT" : "POST", body: JSON.stringify(item) },
      );
      setItem({ ...blank(defaultAuthor), ...data.item });
      await refresh();
      setNotice(`${config.title.slice(0, -1)} saved.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!item._id || !window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await request(`/${config.endpoint}/${item._id}`, { method: "DELETE" });
      setItem(blank(defaultAuthor));
      await refresh();
      setNotice("Content deleted.");
    } catch (e) {
      setError(e.message);
    }
  }
  function update(field, value) {
    setItem((current) => ({ ...current, [field]: value }));
  }
  const previewPath = item.slug
    ? `${config.endpoint === "portfolio" ? "/our-portfolio" : `/${config.endpoint}`}/${item.slug}`
    : "";
  const imageContext =
    section === "testimonialsContent"
      ? `${item.author || "This testimonial"}${item.company ? ` at ${item.company}` : ""} on the site's testimonial sections`
      : `${item.title || "This item"} (${previewPath || `/${config.endpoint}/[slug]`})`;
  const richTextImagePurpose =
    section === "testimonialsContent"
      ? `inline in the testimonial content for ${imageContext}`
      : `inline in the full content for ${imageContext}`;

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold">{config.title}</h2>
            <p className="text-xs text-slate-500">{items.length} items</p>
          </div>
          <button
            onClick={() => {
              setItem(blank(defaultAuthor));
              setNotice("");
              setError("");
            }}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
          >
            + New
          </button>
        </div>
        <div className="max-h-[72vh] space-y-1 overflow-auto">
          {items.map((row) => (
            <button
              key={row._id}
              onClick={() => {
                setItem({ ...blank(), ...row });
                setNotice("");
                setError("");
              }}
              className={`w-full rounded-lg px-3 py-2.5 text-left ${item._id === row._id ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-50"}`}
            >
              <span className="block text-sm font-semibold">{row.title}</span>
              <span className="block truncate text-xs text-slate-500">
                /{config.endpoint}/{row.slug} ·{" "}
                {row.published ? "Published" : "Draft"}
              </span>
            </button>
          ))}
          {!items.length && (
            <p className="px-2 py-5 text-sm text-slate-400">
              No {config.title.toLowerCase()} yet.
            </p>
          )}
        </div>
      </aside>
      <form onSubmit={save} className="space-y-5">
        {(error || notice) && (
          <p
            className={`rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
          >
            {error || notice}
          </p>
        )}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                {config.title.slice(0, -1)} details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Saved through the dedicated {config.endpoint} API and MongoDB
                model.
              </p>
            </div>
            <label className="!mb-0 flex items-center gap-2">
              <input
                className="size-4 !w-4"
                type="checkbox"
                checked={item.published !== false}
                onChange={(e) => update("published", e.target.checked)}
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
                value={item.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div>
              <label>URL slug</label>
              <input
                required
                maxLength={180}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={item.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="my-new-item"
              />
            </div>
            {config.fields.map((field) => (
              <div
                key={field}
                className={
                  field === "content" || field === "quote"
                    ? "sm:col-span-2"
                    : ""
                }
              >
                {field === "content" ? (
                  <div className="space-y-1.5">
                    <label>{labels[field]}</label>
                    <RichTextEditor
                      value={item.content || ""}
                      onChange={(html) => update("content", html)}
                      request={request}
                      imagePurpose={richTextImagePurpose}
                    />
                  </div>
                ) : field === "image" ? (
                  <ImageUploadField
                    label={imageFieldInfo[section].label}
                    purpose={`${imageFieldInfo[section].purpose} Record: ${imageContext}.`}
                    value={item.image || ""}
                    onChange={(url) => update("image", url)}
                    request={request}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <label>{labels[field]}</label>
                    {field === "quote" || field === "summary" ? (
                      <textarea
                        rows={3}
                        maxLength={field === "quote" ? 4000 : 1000}
                        value={item[field] || ""}
                        onChange={(e) => update(field, e.target.value)}
                      />
                    ) : (
                      <input
                        maxLength={180}
                        value={item[field] || ""}
                        onChange={(e) => update(field, e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div>
              <label>Display order</label>
              <input
                type="number"
                value={item.order || 0}
                onChange={(e) => update("order", Number(e.target.value))}
              />
            </div>
          </div>
        </section>
        <div className="sticky bottom-0 flex justify-between border-t border-slate-200 bg-[#f5f7fb]/95 py-4 backdrop-blur">
          <div className="flex gap-2">
            {item._id ? (
              <button
                type="button"
                onClick={remove}
                className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            {previewPath && (
              <a
                href={`${CLIENT_SITE}${previewPath}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Preview ↗
              </a>
            )}
          </div>
          <button
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
