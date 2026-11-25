"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";

const CLIENT_SITE = (
  process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com"
).replace(/\/$/, "");
const CLIENT_ORIGIN = new URL(CLIENT_SITE).origin;
const CMS_API = (
  process.env.NEXT_PUBLIC_CMS_API_URL || "https://digital-solution-1-h8nk.onrender.com/api"
).replace(/\/$/, "");
const blankPage = (path, label) => ({
  path,
  label,
  published: true,
  title: "",
  description: "",
  keywords: "",
  focusKeyword: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  blocks: [],
  contentEdits: [],
  imageAlts: [],
});
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500";
const inventoryPageSize = 12;
const sections = {
  all: {
    title: "Website",
    defaults: ["/new-page", "New page"],
    matches: () => true,
  },
  aboutPage: {
    title: "About",
    defaults: ["/about", "About us"],
    matches: (path) => path === "/about" || path === "/about-us",
  },
  home: {
    title: "Home",
    defaults: ["/", "Home page"],
    matches: (path) => path === "/",
  },
  about: {
    title: "About",
    defaults: ["/about-us", "About us"],
    matches: (path) =>
      ["/about", "/about-us"].some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      ),
  },
  industry: {
    title: "Industry",
    defaults: ["/industries/new-industry", "New industry"],
    matches: (path) =>
      path === "/industries" || path.startsWith("/industries/"),
  },
  legal: {
    title: "Legal",
    defaults: ["/privacy-policy", "Privacy policy"],
    matches: (path) =>
      path === "/legal" ||
      path.startsWith("/legal/") ||
      [
        "/privacy-policy",
        "/term-and-condition",
        "/cancellation-and-refund-policy",
      ].includes(path),
  },
  smm: {
    title: "SMM",
    defaults: ["/smm", "Social media management"],
    matches: (path) =>
      ["/smm", "/social-media-management"].some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      ),
  },
  contact: {
    title: "Contact",
    defaults: ["/contact-us", "Contact us"],
    matches: (path) =>
      ["/contact", "/contact-us"].some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      ),
  },
};

export default function PageManager({
  section,
  routePath = "",
  routeLabel = "",
  hideSEO = false,
  hideList = false,
}) {
  const config = sections[section] || sections.all;
  const { request } = useAdminAuth();
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pageInventory, setPageInventory] = useState({
    content: [],
    images: [],
  });
  const [editorTab, setEditorTab] = useState("content");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryPage, setInventoryPage] = useState(0);
  const previewFrame = useRef(null);

  const refresh = useCallback(async () => {
    const data = await request("/pages/admin");
    setPages(data.pages || []);
  }, [request]);
  const routes = useMemo(
    () =>
      pages.filter(
        (page) =>
          config.matches(page.path) &&
          (!routePath || page.path === routePath) &&
          `${page.label} ${page.path}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [pages, query, config, routePath],
  );
  const previewUrl = useMemo(() => {
    if (!selected?.path) return "";
    const url = new URL(selected.path, `${CLIENT_SITE}/`);
    url.searchParams.set("__page_editor", "1");
    return url.toString();
  }, [selected?.path]);
  const inventoryItems =
    editorTab === "content" ? pageInventory.content : pageInventory.images;
  const filteredInventory = useMemo(() => {
    const search = inventoryQuery.trim().toLowerCase();
    if (!search) return inventoryItems;
    return inventoryItems.filter((item) =>
      [item.tag, item.text, item.href, item.src, item.alt]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [inventoryItems, inventoryQuery]);
  const inventoryPageCount = Math.max(
    1,
    Math.ceil(filteredInventory.length / inventoryPageSize),
  );
  const currentInventoryPage = Math.min(inventoryPage, inventoryPageCount - 1);
  const visibleInventory = filteredInventory.slice(
    currentInventoryPage * inventoryPageSize,
    (currentInventoryPage + 1) * inventoryPageSize,
  );

  useEffect(() => {
    refresh().catch((issue) => setError(issue.message));
  }, [refresh]);
  useEffect(() => {
    if (!selected && routes.length) setSelected(routes[0]);
    else if (selected?._id && !routes.some((page) => page._id === selected._id))
      setSelected(routes[0] || null);
  }, [routes, selected]);

  useEffect(() => {
    setPageInventory({ content: [], images: [] });
    setEditorTab("content");
    setInventoryQuery("");
    setInventoryPage(0);
  }, [selected?.path]);

  useEffect(() => {
    function receiveInventory(event) {
      if (
        event.origin !== CLIENT_ORIGIN ||
        event.source !== previewFrame.current?.contentWindow ||
        event.data?.type !== "page-editor:inventory" ||
        event.data.pathname !== selected?.path ||
        !Array.isArray(event.data.content) ||
        !Array.isArray(event.data.images)
      )
        return;
      setPageInventory({
        content: event.data.content,
        images: event.data.images,
      });
    }
    window.addEventListener("message", receiveInventory);
    return () => window.removeEventListener("message", receiveInventory);
  }, [selected?.path]);

  useEffect(() => {
    previewFrame.current?.contentWindow?.postMessage(
      {
        type: "page-editor:preview",
        contentEdits: selected?.contentEdits || [],
        imageAlts: selected?.imageAlts || [],
      },
      CLIENT_ORIGIN,
    );
  }, [selected?.path, selected?.contentEdits, selected?.imageAlts]);

  function create() {
    const [defaultPath, defaultLabel] = config.defaults;
    const path = routePath || defaultPath;
    const label = routeLabel || defaultLabel;
    setSelected(blankPage(path, label));
    setError("");
    setNotice("");
  }
  function update(field, value) {
    setSelected((current) => ({ ...current, [field]: value }));
  }
  function updateBlock(index, field, value) {
    setSelected((current) => ({
      ...current,
      blocks: current.blocks.map((block, i) =>
        i === index ? { ...block, [field]: value } : block,
      ),
    }));
  }
  function updateContentEdit(item, field, value) {
    setSelected((current) => {
      const edits = current.contentEdits || [];
      const existing = edits.find((edit) => edit.key === item.key);
      const nextEdit = {
        key: item.key,
        type: item.type,
        text: existing?.text ?? item.text,
        href: existing?.href ?? item.href ?? "",
        linkText: existing?.linkText ?? "",
        ...existing,
        [field]: value,
      };
      return {
        ...current,
        contentEdits: [
          ...edits.filter((edit) => edit.key !== item.key),
          nextEdit,
        ],
      };
    });
  }
  function updateImageAlt(image, field, value) {
    setSelected((current) => {
      const images = current.imageAlts || [];
      const existing = images.find((entry) => entry.key === image.key);
      const nextImage = { ...image, ...existing, [field]: value };
      return {
        ...current,
        imageAlts: [
          ...images.filter((entry) => entry.key !== image.key),
          nextImage,
        ],
      };
    });
  }
  async function handleImageUpload(event, onUploaded) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadingImage(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await request("/pages/admin/images", {
        method: "POST",
        body: formData,
      });
      onUploaded(new URL(result.url, new URL(CMS_API).origin).toString());
      setNotice("Image uploaded. Save changes to publish it.");
    } catch (issue) {
      setError(issue.message);
    } finally {
      setUploadingImage(false);
    }
  }
  function requestInventory() {
    previewFrame.current?.contentWindow?.postMessage(
      { type: "page-editor:request-inventory" },
      CLIENT_ORIGIN,
    );
  }
  function addBlock(type) {
    setSelected((current) => ({
      ...current,
      blocks: [
        ...current.blocks,
        { type, text: "", level: 2, url: "", alt: "" },
      ],
    }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await request("/pages/admin", {
        method: "PUT",
        body: JSON.stringify(selected),
      });
      setSelected(data.page);
      await refresh();
      setNotice(
        data.revalidation?.ok
          ? "Page content saved and the website cache was refreshed."
          : `Page content saved, but cache refresh failed: ${data.revalidation?.error || "No revalidation response."}`,
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
        `Delete the published CMS content for ${selected.path}? The client route will return to its empty managed state.`,
      )
    )
      return;
    try {
      const result = await request(`/pages/admin/${selected._id}`, {
        method: "DELETE",
      });
      setSelected(null);
      await refresh();
      setNotice(
        result.revalidation?.ok
          ? "Page changes deleted and the website cache was refreshed."
          : `Page changes deleted, but cache refresh failed: ${result.revalidation?.error || "No revalidation response."}`,
      );
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Website pages</p>
          <h1 className="mt-1 text-2xl font-bold">{config.title} management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edit existing page text, links and image alt text while preserving
            the current website layout.
          </p>
        </div>
        <button
          onClick={create}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          ＋ Add {config.title.toLowerCase()} page
        </button>
      </div>
      {(error || notice) && (
        <p
          className={`rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {error || notice}
        </p>
      )}
      <div
        className={
          hideList
            ? "min-w-0"
            : "grid min-w-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]"
        }
      >
        {!hideList && (
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h2 className="font-bold">{config.title} pages</h2>
              <p className="text-xs text-slate-500">
                {routes.length} routes available
              </p>
            </div>
            <input
              className={`${inputClass} mb-3`}
              placeholder={`Search ${config.title.toLowerCase()} pages`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="max-h-[70vh] space-y-1 overflow-auto">
              {routes.map((page) => (
                <button
                  key={page._id || page.path}
                  onClick={() => {
                    setSelected({
                      ...blankPage(page.path, page.label),
                      ...page,
                    });
                    setError("");
                    setNotice("");
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left ${selected?.path === page.path ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-50"}`}
                >
                  <span className="block text-sm font-semibold">
                    {page.label}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {page.path} ·{" "}
                    {page._id
                      ? page.published
                        ? "Published"
                        : "Draft"
                      : "Default page"}
                  </span>
                </button>
              ))}
              {!routes.length && (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  No matching routes. Add a page to get started.
                </p>
              )}
            </div>
          </section>
        )}
        {selected ? (
          <form onSubmit={save} className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Page details</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the route and whether your changes are live.
                  </p>
                </div>
                <label className="!mb-0 flex items-center gap-2">
                  <input
                    className="size-4 !w-4"
                    type="checkbox"
                    checked={selected.published !== false}
                    onChange={(event) =>
                      update("published", event.target.checked)
                    }
                  />
                  Published
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label>Page name</label>
                  <input
                    required
                    maxLength={160}
                    value={selected.label}
                    onChange={(event) => update("label", event.target.value)}
                  />
                </div>
                <div>
                  <label>Client page URL</label>
                  <input
                    required
                    readOnly={Boolean(routePath)}
                    value={selected.path}
                    onChange={(event) => update("path", event.target.value)}
                    placeholder="/about-us"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label>Focus keyword</label>
                  <input
                    className={inputClass}
                    maxLength={200}
                    value={selected.focusKeyword || ""}
                    onChange={(event) =>
                      update("focusKeyword", event.target.value)
                    }
                    placeholder="Main phrase this page should rank for"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Use this phrase naturally in the page content and SEO
                    fields.
                  </p>
                </div>
              </div>
            </section>
            {!hideSEO && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-1 text-lg font-bold">
                  SEO and social preview
                </h2>
                <p className="mb-5 text-sm text-slate-500">
                  Set the title and description used by search engines and
                  social links.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label>SEO title</label>
                    <input
                      maxLength={300}
                      value={selected.title}
                      onChange={(event) => update("title", event.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Meta description</label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={selected.description}
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Keywords (comma separated)</label>
                    <input
                      value={selected.keywords}
                      onChange={(event) =>
                        update("keywords", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label>Canonical URL</label>
                    <input
                      type="url"
                      value={selected.canonicalUrl}
                      onChange={(event) =>
                        update("canonicalUrl", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label>Open Graph title</label>
                    <input
                      value={selected.ogTitle}
                      onChange={(event) =>
                        update("ogTitle", event.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Open Graph description</label>
                    <textarea
                      rows={2}
                      value={selected.ogDescription}
                      onChange={(event) =>
                        update("ogDescription", event.target.value)
                      }
                    />
                  </div>
                </div>
              </section>
            )}
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold">Edit page content</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Edit existing text and links, replace page images,
                  and set their alt text and titles without changing the page
                  layout.
                </p>
              </div>
              <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <iframe
                  key={selected.path}
                  ref={previewFrame}
                  src={previewUrl}
                  title={`Live preview of ${selected.label}`}
                  onLoad={requestInventory}
                  className="h-[620px] w-full rounded-xl border border-slate-200 bg-white"
                />
                <div className="min-w-0">
                  <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {[
                      [
                        "content",
                        `Content & links (${pageInventory.content.length})`,
                      ],
                      ["images", `Images (${pageInventory.images.length})`],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setEditorTab(value);
                          setInventoryQuery("");
                          setInventoryPage(0);
                        }}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                          editorTab === value
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    className={`${inputClass} mb-2`}
                    value={inventoryQuery}
                    onChange={(event) => {
                      setInventoryQuery(event.target.value);
                      setInventoryPage(0);
                    }}
                    placeholder={
                      editorTab === "content"
                        ? "Search text or links"
                        : "Search image filename or alt text"
                    }
                    aria-label={
                      editorTab === "content"
                        ? "Search page content and links"
                        : "Search page images"
                    }
                  />
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {filteredInventory.length
                        ? `${currentInventoryPage * inventoryPageSize + 1}–${Math.min(
                            (currentInventoryPage + 1) * inventoryPageSize,
                            filteredInventory.length,
                          )} of ${filteredInventory.length}`
                        : "No matching items"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentInventoryPage === 0}
                        onClick={() =>
                          setInventoryPage((page) => Math.max(0, page - 1))
                        }
                        className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span>
                        {currentInventoryPage + 1}/{inventoryPageCount}
                      </span>
                      <button
                        type="button"
                        disabled={
                          currentInventoryPage >= inventoryPageCount - 1
                        }
                        onClick={() =>
                          setInventoryPage((page) =>
                            Math.min(inventoryPageCount - 1, page + 1),
                          )
                        }
                        className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[570px] space-y-3 overflow-y-auto pr-1">
                    {editorTab === "content" &&
                      visibleInventory.map((item) => {
                        const edit = (selected.contentEdits || []).find(
                          (entry) => entry.key === item.key,
                        );
                        return (
                          <article
                            key={item.key}
                            className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="text-xs font-bold uppercase text-indigo-700">
                              {item.tag}
                            </p>
                            <label className="block text-xs font-semibold text-slate-600">
                              {item.type === "link" ? "Link text" : "Page text"}
                              <textarea
                                className={`${inputClass} mt-1`}
                                rows={2}
                                value={edit?.text ?? item.text}
                                onChange={(event) =>
                                  updateContentEdit(
                                    item,
                                    "text",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                            <label className="block text-xs font-semibold text-slate-600">
                              {item.type === "link"
                                ? "Link URL"
                                : "Add a link to this text (optional)"}
                              <input
                                className={`${inputClass} mt-1`}
                                value={edit?.href ?? item.href ?? ""}
                                onChange={(event) =>
                                  updateContentEdit(
                                    item,
                                    "href",
                                    event.target.value,
                                  )
                                }
                                placeholder="https://example.com or /contact"
                              />
                            </label>
                            {item.type === "text" && (
                              <label className="block text-xs font-semibold text-slate-600">
                                Text to link (exact phrase)
                                <input
                                  className={`${inputClass} mt-1`}
                                  value={edit?.linkText ?? ""}
                                  onChange={(event) =>
                                    updateContentEdit(
                                      item,
                                      "linkText",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="e.g. challenge assumptions"
                                />
                                <span className="mt-1 block font-normal text-slate-500">
                                  {!edit?.href
                                    ? "Add a link URL and exact phrase to create a hyperlink."
                                    : !edit.linkText?.trim()
                                      ? "Enter the exact phrase you want to make clickable."
                                      : !(edit.text ?? item.text).includes(
                                            edit.linkText.trim(),
                                          )
                                        ? "This exact phrase is not in the page text."
                                        : "Only this exact phrase will be clickable."}
                                </span>
                              </label>
                            )}
                          </article>
                        );
                      })}
                    {editorTab === "images" &&
                      visibleInventory.map((image) => {
                        const override = (selected.imageAlts || []).find(
                          (entry) => entry.key === image.key,
                        );
                        const imageSource = override?.src || image.src;
                        const imagePurpose =
                          image.label ||
                          `Page image: ${override?.alt || image.alt || override?.title || image.title || "shown in the live preview"}`;
                        const source = /^https?:\/\//i.test(imageSource)
                          ? imageSource
                          : `${CLIENT_SITE}${imageSource.startsWith("/") ? "" : "/"}${imageSource}`;
                        return (
                          <article
                            key={image.key}
                            className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="col-span-2 text-xs font-bold text-indigo-700">
                              Page: {selected.path} · Used as: {imagePurpose}
                            </p>
                            <img
                              src={source}
                              alt={override?.alt ?? image.alt}
                              title={override?.title ?? image.title}
                              className="size-[72px] rounded-lg border border-slate-200 bg-white object-contain"
                            />
                            <div className="min-w-0 space-y-2 text-xs font-semibold text-slate-600">
                              <label className="block">
                                Image title
                                <input
                                  className={`${inputClass} mt-1`}
                                  maxLength={300}
                                  value={override?.title ?? image.title ?? ""}
                                  onChange={(event) =>
                                    updateImageAlt(
                                      image,
                                      "title",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Optional image title"
                                />
                              </label>
                              <label className="block">
                                Alt text
                                <input
                                  className={`${inputClass} mt-1`}
                                  maxLength={500}
                                  value={override?.alt ?? image.alt}
                                  onChange={(event) =>
                                    updateImageAlt(
                                      image,
                                      "alt",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Describe this image"
                                />
                              </label>
                              <label className="block">
                                Replace this image on {selected.path}
                                <input
                                  className={`${inputClass} mt-1`}
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  disabled={uploadingImage}
                                  onChange={(event) =>
                                    handleImageUpload(event, (url) =>
                                      updateImageAlt(image, "src", url),
                                    )
                                  }
                                />
                              </label>
                              <span className="block truncate font-normal text-slate-400">
                                {image.src}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    {filteredInventory.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                        {inventoryItems.length === 0
                          ? "Preview is loading or this page has no matching content."
                          : "No content matches this search."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Legacy content blocks</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    These stored blocks do not replace the existing site layout.
                    Use the live preview above to edit the current page's
                    content and links.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["heading", "＋ Heading"],
                    ["text", "＋ Text"],
                    ["button", "＋ Button"],
                    ["image", "＋ Image"],
                  ].map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addBlock(type)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-indigo-400"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {selected.blocks.map((block, index) => (
                  <article
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wide text-indigo-700 uppercase">
                        {block.type}
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const blocks = [...selected.blocks];
                            [blocks[index - 1], blocks[index]] = [
                              blocks[index],
                              blocks[index - 1],
                            ];
                            update("blocks", blocks);
                          }}
                          className="text-xs text-slate-500 disabled:opacity-30"
                        >
                          ↑ Move
                        </button>
                        <button
                          type="button"
                          disabled={index === selected.blocks.length - 1}
                          onClick={() => {
                            const blocks = [...selected.blocks];
                            [blocks[index + 1], blocks[index]] = [
                              blocks[index],
                              blocks[index + 1],
                            ];
                            update("blocks", blocks);
                          }}
                          className="text-xs text-slate-500 disabled:opacity-30"
                        >
                          ↓ Move
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              "blocks",
                              selected.blocks.filter((_, i) => i !== index),
                            )
                          }
                          className="text-xs text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {block.type === "heading" && (
                      <div className="mb-3">
                        <label>Heading size</label>
                        <select
                          className={inputClass}
                          value={block.level || 2}
                          onChange={(event) =>
                            updateBlock(
                              index,
                              "level",
                              Number(event.target.value),
                            )
                          }
                        >
                          <option value={1}>Large</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Small</option>
                        </select>
                      </div>
                    )}
                    {block.type === "image" && (
                      <>
                        <div className="mb-3">
                          <label>
                            Upload image for this page's legacy content block
                          </label>
                          <input
                            className={inputClass}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            disabled={uploadingImage}
                            onChange={(event) =>
                              handleImageUpload(event, (url) =>
                                updateBlock(index, "url", url),
                              )
                            }
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Page: {selected.path}. This image belongs to this
                            block; legacy blocks do not change the live page
                            layout.
                          </p>
                        </div>
                        <div className="mb-3">
                          <label>Alt text</label>
                          <input
                            className={inputClass}
                            value={block.alt || ""}
                            onChange={(event) =>
                              updateBlock(index, "alt", event.target.value)
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label>Image title</label>
                          <input
                            className={inputClass}
                            value={block.title || ""}
                            onChange={(event) =>
                              updateBlock(index, "title", event.target.value)
                            }
                          />
                        </div>
                      </>
                    )}
                    {block.type === "button" && (
                      <div className="mb-3">
                        <label>Button link</label>
                        <input
                          className={inputClass}
                          value={block.url || ""}
                          onChange={(event) =>
                            updateBlock(index, "url", event.target.value)
                          }
                          placeholder="/contact"
                        />
                      </div>
                    )}
                    <label>
                      {block.type === "button"
                        ? "Button label"
                        : block.type === "image"
                          ? "Caption (optional)"
                          : "Text"}
                    </label>
                    <textarea
                      className={inputClass}
                      rows={block.type === "text" ? 4 : 2}
                      value={block.text || ""}
                      onChange={(event) =>
                        updateBlock(index, "text", event.target.value)
                      }
                    />
                  </article>
                ))}
                {!selected.blocks.length && (
                  <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                    No content blocks yet. Add blocks, then save and publish to
                    show content on the client.
                  </div>
                )}
              </div>
            </section>
            <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-[#f5f7fb]/95 py-4 backdrop-blur">
              <div className="flex gap-2">
                {selected._id && (
                  <button
                    type="button"
                    onClick={remove}
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    Delete override
                  </button>
                )}
                {
                  <a
                    href={`${CLIENT_SITE}${selected.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
                  >
                    Preview ↗
                  </a>
                }
              </div>
              <button
                disabled={busy}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy
                  ? "Saving…"
                  : selected._id
                    ? "Save changes"
                    : "Create page"}
              </button>
            </div>
          </form>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Select a route or add a page to start editing.
          </section>
        )}
      </div>
    </div>
  );
}
