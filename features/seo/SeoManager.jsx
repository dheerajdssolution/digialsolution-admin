"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";

const CLIENT_SITE = (
  process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com"
).replace(/\/+$/, "");
const PAGE_SIZE = 100;
const pageSections = [
  { id: "services", label: "Services", icon: "◇" },
  { id: "digital-marketing", label: "Digital Marketing", icon: "◈" },
  { id: "features", label: "Features", icon: "✦" },
  { id: "blog", label: "Blog", icon: "✎" },
  { id: "industries", label: "Industries", icon: "▥" },
  { id: "case-studies", label: "Case studies", icon: "▧" },
  { id: "careers", label: "Careers", icon: "◉" },
  { id: "about", label: "About", icon: "◎" },
  { id: "other", label: "Other pages", icon: "▦" },
];
const input =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const labelStyle = "block text-sm font-semibold text-slate-700";
const button =
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${button} bg-indigo-600 text-white hover:bg-indigo-700`;
const secondaryButton = `${button} border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700`;
const blankSettings = {
  siteUrl: CLIENT_SITE,
  siteName: "",
  defaultOgImage: "",
  ga4MeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  customHeadScripts: "",
  customBodyStartScripts: "",
  customFooterScripts: "",
  robotsExtraRules: "",
  globalSchemaJson: "[]",
};
const blankPage = {
  path: "",
  label: "",
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noindex: false,
  includeInSitemap: true,
  lastmod: "",
  changefreq: "monthly",
  priority: 0.5,
  schemaJson: "[]",
};
const schemaTemplates = [
  "Organization",
  "LocalBusiness",
  "Product",
  "Article/BlogPosting",
  "FAQPage",
  "BreadcrumbList",
  "Service",
];
const globalSchemaTemplates = ["Organization", "LocalBusiness", "WebSite"];

function pageSection(path) {
  const normalizedPath = path.toLowerCase();
  if (/^\/digital-marketing(?:\/|$)/.test(normalizedPath))
    return "digital-marketing";
  if (/^\/services?(?:\/|$)/.test(normalizedPath)) return "services";
  if (/^\/features(?:\/|$)/.test(normalizedPath)) return "features";
  if (/^\/blogs?(?:\/|$)/.test(normalizedPath)) return "blog";
  if (/^\/industries(?:\/|$)/.test(normalizedPath)) return "industries";
  if (/^\/case-studies?(?:\/|$)/.test(normalizedPath))
    return "case-studies";
  if (/^\/careers(?:\/|$)/.test(normalizedPath)) return "careers";
  if (/^\/about(?:\/|$)/.test(normalizedPath)) return "about";
  return "other";
}

function schemaError(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    const schemas = Array.isArray(parsed) ? parsed : [parsed];
    if (
      !schemas.every(
        (schema) =>
          schema &&
          typeof schema === "object" &&
          !Array.isArray(schema) &&
          schema["@context"] &&
          schema["@type"],
      )
    ) {
      return 'Every JSON-LD object must include "@context" and "@type".';
    }
    return "";
  } catch {
    return "Enter valid JSON before saving.";
  }
}

function formPage(page) {
  return {
    ...blankPage,
    ...page,
    lastmod: page.lastmod
      ? new Date(page.lastmod).toISOString().slice(0, 10)
      : "",
    schemaJson: page.schemaJson || "[]",
  };
}

function schemaTemplate(type, page, settings) {
  const name = page.metaTitle || page.label || page.path || settings.siteName;
  const url = page.canonicalUrl || `${settings.siteUrl || CLIENT_SITE}${page.path}`;
  const shared = { "@context": "https://schema.org", "@type": type };
  if (type === "Organization")
    return { ...shared, name: settings.siteName || name, url: settings.siteUrl || CLIENT_SITE };
  if (type === "LocalBusiness")
    return {
      ...shared,
      name,
      url,
      image: page.ogImage || settings.defaultOgImage || "",
      telephone: "",
      address: {
        "@type": "PostalAddress",
        streetAddress: "",
        addressLocality: "",
        addressRegion: "",
        postalCode: "",
        addressCountry: "",
      },
    };
  if (type === "Product")
    return {
      ...shared,
      name,
      description: page.metaDescription || "",
      image: page.ogImage || "",
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "USD",
        price: "",
        availability: "https://schema.org/InStock",
      },
    };
  if (type === "Article/BlogPosting")
    return {
      ...shared,
      "@type": "BlogPosting",
      headline: name,
      description: page.metaDescription || "",
      image: page.ogImage ? [page.ogImage] : [],
      datePublished: "",
      author: { "@type": "Person", name: "Admin" },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    };
  if (type === "FAQPage") return { ...shared, mainEntity: [] };
  if (type === "BreadcrumbList")
    return {
      ...shared,
      itemListElement: page.path
        .split("/")
        .filter(Boolean)
        .map((part, index, parts) => ({
          "@type": "ListItem",
          position: index + 1,
          name: part.replace(/-/g, " "),
          item: `${settings.siteUrl || CLIENT_SITE}/${parts
            .slice(0, index + 1)
            .join("/")}`,
        })),
    };
  if (type === "Service")
    return {
      ...shared,
      name,
      description: page.metaDescription || "",
      url,
      provider: {
        "@type": "Organization",
        name: settings.siteName || "DS Solution",
        url: settings.siteUrl || CLIENT_SITE,
      },
    };
  return {
    ...shared,
    name: settings.siteName || name,
    url: settings.siteUrl || CLIENT_SITE,
  };
}

function globalSchemaTemplate(type, settings) {
  const url = settings.siteUrl || CLIENT_SITE;
  if (type === "Organization")
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.siteName || "DS Solution",
      url,
    };
  if (type === "WebSite")
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.siteName || "DS Solution",
      url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url.replace(/\/+$/, "")}/blog?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.siteName || "DS Solution",
    url,
    image: settings.defaultOgImage || "",
    address: {
      "@type": "PostalAddress",
      streetAddress: "",
      addressLocality: "",
      addressRegion: "",
      postalCode: "",
      addressCountry: "",
    },
    telephone: "",
  };
}

function Feedback({ value }) {
  if (!value) return null;
  return (
    <p
      role={value.kind === "error" ? "alert" : "status"}
      className={`rounded-xl p-3 text-sm ${
        value.kind === "error"
          ? "bg-red-50 text-red-700"
          : value.kind === "warning"
            ? "bg-amber-50 text-amber-800"
            : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {value.text}
    </p>
  );
}

export default function SeoManager() {
  const { request } = useAdminAuth();
  const [tab, setTab] = useState("pages");
  const [feedback, setFeedback] = useState(null);
  const [settings, setSettings] = useState(blankSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [pageForm, setPageForm] = useState(blankPage);
  const [pageSaving, setPageSaving] = useState(false);
  const [sitemap, setSitemap] = useState(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapBusy, setSitemapBusy] = useState(false);
  const [pageTemplate, setPageTemplate] = useState(schemaTemplates[0]);
  const [globalTemplate, setGlobalTemplate] = useState(globalSchemaTemplates[0]);

  const pageSchemaError = useMemo(
    () => schemaError(pageForm.schemaJson),
    [pageForm.schemaJson],
  );
  const globalSchemaError = useMemo(
    () => schemaError(settings.globalSchemaJson),
    [settings.globalSchemaJson],
  );
  const currentPage = pages.find((item) => item.path === selectedPath);
  const pageGroups = useMemo(
    () =>
      pageSections.map((section) => ({
        ...section,
        count: pages.filter((page) => pageSection(page.path) === section.id)
          .length,
      })),
    [pages],
  );
  const visiblePages = useMemo(() => {
    const matchesSearch = (item) =>
      `${item.path} ${item.label} ${item.metaTitle}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    return pages.filter(
      (item) =>
        (!selectedSection || pageSection(item.path) === selectedSection) &&
        matchesSearch(item),
    );
  }, [pages, search, selectedSection]);

  useEffect(() => {
    let active = true;
    setSettingsLoading(true);
    request("/admin/seo/settings")
      .then((data) => {
        if (active && data.settings) {
          setSettings({ ...blankSettings, ...data.settings });
        }
      })
      .catch((error) => {
        if (active) setFeedback({ kind: "error", text: error.message });
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [request]);

  const loadPages = useCallback(async () => {
    setPagesLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(PAGE_SIZE),
      });
      const firstPage = await request(`/admin/seo/pages?${params}`);
      if (!Array.isArray(firstPage.items))
        throw new Error("Page SEO list is invalid.");
      const pageCount = Math.ceil((Number(firstPage.total) || 0) / PAGE_SIZE);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          request(
            `/admin/seo/pages?${new URLSearchParams({
              page: String(index + 2),
              limit: String(PAGE_SIZE),
            })}`,
          ),
        ),
      );
      if (remainingPages.some((data) => !Array.isArray(data.items)))
        throw new Error("Page SEO list is invalid.");
      const allPages = [
        ...firstPage.items,
        ...remainingPages.flatMap((data) => data.items),
      ];
      setPages(allPages);
      setSelectedPath((current) =>
        current && allPages.some((item) => item.path === current)
          ? current
          : "",
      );
    } finally {
      setPagesLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadPages().catch((error) =>
      setFeedback({ kind: "error", text: error.message }),
    );
  }, [loadPages]);

  useEffect(() => {
    if (currentPage) setPageForm(formPage(currentPage));
  }, [currentPage]);

  const loadSitemap = useCallback(async () => {
    setSitemapLoading(true);
    try {
      const data = await request("/seo/sitemap");
      if (!data.siteUrl || !Array.isArray(data.urls))
        throw new Error("Sitemap preview returned an invalid response.");
      setSitemap(data);
    } finally {
      setSitemapLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (tab !== "sitemap") return;
    loadSitemap().catch((error) =>
      setFeedback({ kind: "error", text: error.message }),
    );
  }, [tab, loadSitemap]);

  function updateSettings(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updatePage(field, value) {
    setPageForm((current) => ({ ...current, [field]: value }));
  }

  function choosePage(item) {
    setSelectedPath(item.path);
    setIsAddingPage(false);
    setPageForm(formPage(item));
    setFeedback(null);
  }

  function addPage() {
    setSelectedPath("");
    setIsAddingPage(true);
    setPageForm({ ...blankPage });
    setFeedback(null);
  }

  function appendGlobalTemplate() {
    let current;
    try {
      current = JSON.parse(settings.globalSchemaJson || "[]");
    } catch {
      setFeedback({
        kind: "error",
        text: "Fix the global JSON-LD before adding a template.",
      });
      return;
    }
    const schemas = Array.isArray(current) ? current : [current];
    schemas.push(globalSchemaTemplate(globalTemplate, settings));
    updateSettings("globalSchemaJson", JSON.stringify(schemas, null, 2));
  }

  function insertPageTemplate() {
    updatePage(
      "schemaJson",
      JSON.stringify(schemaTemplate(pageTemplate, pageForm, settings), null, 2),
    );
  }

  async function saveSettings(event) {
    event.preventDefault();
    setFeedback(null);
    if (globalSchemaError) {
      setFeedback({ kind: "error", text: globalSchemaError });
      return;
    }
    setSettingsSaving(true);
    try {
      const result = await request("/admin/seo/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
          globalSchemaJson: settings.globalSchemaJson || "[]",
        }),
      });
      setSettings({ ...blankSettings, ...result.settings });
      setFeedback(
        result.revalidation?.ok
          ? { kind: "success", text: "SEO settings saved and the site cache was refreshed." }
          : {
              kind: "warning",
              text: `Settings were saved, but cache refresh failed: ${result.revalidation?.error || "No revalidation response."}`,
            },
      );
    } catch (error) {
      setFeedback({ kind: "error", text: error.message });
    } finally {
      setSettingsSaving(false);
    }
  }

  async function savePage(event) {
    event.preventDefault();
    setFeedback(null);
    if (pageSchemaError) {
      setFeedback({ kind: "error", text: pageSchemaError });
      return;
    }
    setPageSaving(true);
    try {
      const payload = {
        ...pageForm,
        schemaJson: pageForm.schemaJson || "[]",
        lastmod: pageForm.lastmod
          ? new Date(`${pageForm.lastmod}T00:00:00.000Z`).toISOString()
          : "",
        priority: Number(pageForm.priority),
      };
      const result = await request(
        pageForm._id
          ? `/admin/seo/pages/${encodeURIComponent(pageForm._id)}`
          : "/admin/seo/pages",
        {
          method: pageForm._id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      const saved = formPage(result.page);
      setPageForm(saved);
      setSelectedPath(saved.path);
      setSelectedSection(pageSection(saved.path));
      setIsAddingPage(false);
      setSearch("");
      await loadPages();
      setFeedback(
        result.revalidation?.ok
          ? { kind: "success", text: `SEO saved for ${saved.path}; site cache refreshed.` }
          : {
              kind: "warning",
              text: `SEO saved for ${saved.path}, but cache refresh failed: ${result.revalidation?.error || "No revalidation response."}`,
            },
      );
    } catch (error) {
      setFeedback({ kind: "error", text: error.message });
    } finally {
      setPageSaving(false);
    }
  }

  async function deletePage() {
    if (!pageForm._id || !window.confirm(`Delete SEO settings for ${pageForm.path}?`))
      return;
    setFeedback(null);
    setPageSaving(true);
    try {
      const result = await request(
        `/admin/seo/pages/${encodeURIComponent(pageForm._id)}`,
        { method: "DELETE" },
      );
      setSelectedPath("");
      setIsAddingPage(false);
      setPageForm({ ...blankPage });
      await loadPages();
      setFeedback(
        result.revalidation?.ok
          ? { kind: "success", text: "Page SEO entry deleted and cache refreshed." }
          : {
              kind: "warning",
              text: `Page SEO entry deleted, but cache refresh failed: ${result.revalidation?.error || "No revalidation response."}`,
            },
      );
    } catch (error) {
      setFeedback({ kind: "error", text: error.message });
    } finally {
      setPageSaving(false);
    }
  }

  async function regenerateSitemap() {
    setFeedback(null);
    setSitemapBusy(true);
    try {
      await request("/admin/seo/revalidate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadSitemap();
      setFeedback({ kind: "success", text: "Sitemap and robots cache regenerated." });
    } catch (error) {
      setFeedback({ kind: "error", text: error.message });
    } finally {
      setSitemapBusy(false);
    }
  }

  const sitemapPreview = useMemo(() => {
    if (!sitemap) return "";
    return `${sitemap.siteUrl.replace(/\/+$/, "")}/sitemap.xml`;
  }, [sitemap]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">
          Search visibility
        </p>
        <h1 className="mt-1 text-3xl font-bold">SEO Management</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Manage site-wide SEO, per-page metadata, structured data, tracking,
          sitemap and robots rules.
        </p>
      </header>
      <Feedback value={feedback} />
      <nav
        role="tablist"
        aria-label="SEO management sections"
        className="flex flex-wrap gap-2 border-b border-slate-200"
      >
        {[
          ["settings", "Settings"],
          ["pages", "Page SEO"],
          ["sitemap", "Sitemap"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => {
              setTab(value);
              setFeedback(null);
            }}
            className={`rounded-t-xl px-5 py-3 text-sm font-semibold ${
              tab === value
                ? "border-b-2 border-indigo-600 bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "settings" && (
        <form
          onSubmit={saveSettings}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          <div>
            <h2 className="text-xl font-bold">Site information</h2>
            <p className="mt-1 text-sm text-slate-500">
              These values provide default canonical, Open Graph and verification metadata. Paste a verification token or its full meta tag.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["siteUrl", "Website URL", "url"],
              ["siteName", "Website name", "text"],
              ["defaultOgImage", "Default Open Graph image", "url"],
              ["ga4MeasurementId", "GA4 measurement ID", "text"],
              ["gtmContainerId", "Google Tag Manager ID", "text"],
              ["metaPixelId", "Meta Pixel ID", "text"],
              ["googleSiteVerification", "Google Search Console verification", "text"],
              ["bingSiteVerification", "Bing verification", "text"],
            ].map(([field, label, type]) => (
              <label className={labelStyle} key={field}>
                {label}
                <input
                  className={input}
                  type={type}
                  value={settings[field] || ""}
                  onChange={(event) => updateSettings(field, event.target.value)}
                />
              </label>
            ))}
          </div>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <div>
              <h3 className="font-bold">Global JSON-LD schemas</h3>
              <p className="mt-1 text-sm text-slate-500">
                Injected site-wide. Templates are starting points; complete business facts before publishing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className={`${input} mt-0 max-w-xs`}
                value={globalTemplate}
                onChange={(event) => setGlobalTemplate(event.target.value)}
              >
                {globalSchemaTemplates.map((template) => (
                  <option key={template}>{template}</option>
                ))}
              </select>
              <button
                type="button"
                className={secondaryButton}
                onClick={appendGlobalTemplate}
              >
                Add schema template
              </button>
            </div>
            <textarea
              className={`${input} font-mono text-xs`}
              rows={12}
              value={settings.globalSchemaJson || "[]"}
              onChange={(event) => updateSettings("globalSchemaJson", event.target.value)}
              spellCheck="false"
            />
            {globalSchemaError && (
              <p className="text-sm text-red-700" role="alert">
                {globalSchemaError}
              </p>
            )}
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="font-bold">Robots.txt extra rules</h3>
              <p className="mt-1 text-sm text-slate-500">
                Public pages are allowed; /admin and /api stay disallowed. Add one supported directive per line.
              </p>
            </div>
            <textarea
              className={input}
              rows={4}
              value={settings.robotsExtraRules || ""}
              onChange={(event) => updateSettings("robotsExtraRules", event.target.value)}
              placeholder={"Disallow: /private\nCrawl-delay: 5"}
            />
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="font-bold">Custom scripts</h3>
              <p className="mt-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Warning: custom JavaScript runs on the public website. Use trusted code only; incorrect scripts can break the site. Paste inline JavaScript without script tags. These fields are restricted to authenticated administrators.
              </p>
            </div>
            {[
              ["customHeadScripts", "Head scripts"],
              ["customBodyStartScripts", "Body-start scripts"],
              ["customFooterScripts", "Footer scripts"],
            ].map(([field, label]) => (
              <label className={labelStyle} key={field}>
                {label}
                <textarea
                  className={`${input} font-mono text-xs`}
                  rows={4}
                  value={settings[field] || ""}
                  onChange={(event) => updateSettings(field, event.target.value)}
                  spellCheck="false"
                  placeholder="Paste inline JavaScript (no <script> tags)"
                />
              </label>
            ))}
          </section>

          <button
            className={primaryButton}
            disabled={settingsLoading || settingsSaving || Boolean(globalSchemaError)}
          >
            {settingsSaving ? "Saving…" : "Save SEO settings"}
          </button>
        </form>
      )}

      {tab === "pages" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Page SEO</h2>
              <p className="mt-1 text-sm text-slate-500">
                {pagesLoading
                  ? "Loading pages…"
                  : `${pages.length} pages and custom paths`}
              </p>
            </div>
            <button type="button" className={primaryButton} onClick={addPage}>
              Add page path
            </button>
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
              <label className={labelStyle} htmlFor="seo-page-search">
                Search pages
              </label>
              <input
                id="seo-page-search"
                className={input}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Path, page name, or SEO title"
              />
              {(selectedSection || search) && (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  onClick={() => {
                    setSelectedSection("");
                    setSelectedPath("");
                    setIsAddingPage(false);
                    setPageForm({ ...blankPage });
                    setSearch("");
                  }}
                >
                  ← All sections
                </button>
              )}
              {selectedSection && (
                <div className="mt-4 border-b border-slate-100 px-3 pb-3">
                  <p className="text-sm font-bold text-slate-800">
                    {pageSections.find((section) => section.id === selectedSection)?.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {visiblePages.length} pages shown
                  </p>
                </div>
              )}
              <div className="mt-4 max-h-[65vh] space-y-1 overflow-y-auto">
                {!selectedSection && !search &&
                  pageGroups.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      disabled={section.count === 0 || pagesLoading}
                      onClick={() => {
                        setSelectedSection(section.id);
                        setSelectedPath("");
                        setIsAddingPage(false);
                        setPageForm({ ...blankPage });
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-indigo-600">{section.icon}</span>
                        <span className="text-sm font-semibold">
                          {section.label}
                        </span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {section.count}
                      </span>
                    </button>
                  ))}
                {(selectedSection || search) &&
                  visiblePages.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => choosePage(item)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left ${
                        selectedPath === item.path
                          ? "bg-indigo-50 text-indigo-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block truncate text-sm font-semibold">
                        {item.label || item.path}
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          selectedPath === item.path
                            ? "text-indigo-500"
                            : "text-slate-400"
                        }`}
                      >
                        {item.path}
                      </span>
                    </button>
                  ))}
                {!pagesLoading &&
                  (selectedSection || search) &&
                  visiblePages.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">
                    No matching pages.
                  </p>
                )}
              </div>
            </section>

            {selectedPath || isAddingPage ? (
              <form
              onSubmit={savePage}
              className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
                    Page metadata
                  </p>
                  <h3 className="mt-1 text-xl font-bold">
                    {pageForm.label || "New page SEO"}
                  </h3>
                </div>
                {pageForm.path && (
                  <a
                    href={`${CLIENT_SITE}${pageForm.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className={secondaryButton}
                  >
                    Preview page ↗
                  </a>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelStyle}>
                  Page path
                  <input
                    className={input}
                    required
                    maxLength={500}
                    value={pageForm.path}
                    onChange={(event) => updatePage("path", event.target.value)}
                    placeholder="/example-page"
                    disabled={Boolean(pageForm._id)}
                  />
                </label>
                <label className={labelStyle}>
                  Page label
                  <input
                    className={input}
                    maxLength={160}
                    value={pageForm.label || ""}
                    onChange={(event) => updatePage("label", event.target.value)}
                    placeholder="Page name"
                  />
                </label>
                <label className={`${labelStyle} sm:col-span-2`}>
                  Meta title
                  <input
                    className={input}
                    maxLength={300}
                    value={pageForm.metaTitle || ""}
                    onChange={(event) => updatePage("metaTitle", event.target.value)}
                  />
                </label>
                <label className={`${labelStyle} sm:col-span-2`}>
                  Meta description
                  <textarea
                    className={input}
                    rows={3}
                    maxLength={1000}
                    value={pageForm.metaDescription || ""}
                    onChange={(event) => updatePage("metaDescription", event.target.value)}
                  />
                </label>
                <label className={labelStyle}>
                  Canonical URL
                  <input
                    className={input}
                    type="url"
                    value={pageForm.canonicalUrl || ""}
                    onChange={(event) => updatePage("canonicalUrl", event.target.value)}
                    placeholder={`${settings.siteUrl || CLIENT_SITE}${pageForm.path || "/"}`}
                  />
                </label>
                <label className={labelStyle}>
                  Open Graph image
                  <input
                    className={input}
                    type="url"
                    value={pageForm.ogImage || ""}
                    onChange={(event) => updatePage("ogImage", event.target.value)}
                  />
                </label>
                <label className={labelStyle}>
                  Open Graph title
                  <input
                    className={input}
                    maxLength={300}
                    value={pageForm.ogTitle || ""}
                    onChange={(event) => updatePage("ogTitle", event.target.value)}
                  />
                </label>
                <label className={labelStyle}>
                  Open Graph description
                  <textarea
                    className={input}
                    rows={2}
                    maxLength={1000}
                    value={pageForm.ogDescription || ""}
                    onChange={(event) => updatePage("ogDescription", event.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className={labelStyle}>
                  Last modified
                  <input
                    className={input}
                    type="date"
                    value={pageForm.lastmod || ""}
                    onChange={(event) => updatePage("lastmod", event.target.value)}
                  />
                </label>
                <label className={labelStyle}>
                  Change frequency
                  <select
                    className={input}
                    value={pageForm.changefreq || "monthly"}
                    onChange={(event) => updatePage("changefreq", event.target.value)}
                  >
                    {["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className={labelStyle}>
                  Priority (0–1)
                  <input
                    className={input}
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={pageForm.priority ?? 0.5}
                    onChange={(event) => updatePage("priority", event.target.value)}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(pageForm.noindex)}
                    onChange={(event) => updatePage("noindex", event.target.checked)}
                  />
                  Noindex this page
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(pageForm.includeInSitemap)}
                    onChange={(event) => updatePage("includeInSitemap", event.target.checked)}
                  />
                  Include in sitemap
                </label>
              </div>

              <section className="space-y-3 border-t border-slate-100 pt-5">
                <div>
                  <h4 className="font-bold">Page structured data</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    A valid template is inserted into the editor; verify its facts before saving.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className={`${input} mt-0 max-w-xs`}
                    value={pageTemplate}
                    onChange={(event) => setPageTemplate(event.target.value)}
                  >
                    {schemaTemplates.map((template) => (
                      <option key={template}>{template}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={insertPageTemplate}
                  >
                    Insert template
                  </button>
                </div>
                <textarea
                  className={`${input} font-mono text-xs`}
                  rows={12}
                  value={pageForm.schemaJson || "[]"}
                  onChange={(event) => updatePage("schemaJson", event.target.value)}
                  spellCheck="false"
                />
                {pageSchemaError && (
                  <p className="text-sm text-red-700" role="alert">
                    {pageSchemaError}
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                  Search preview
                </p>
                <p className="mt-2 truncate text-lg font-medium text-blue-800">
                  {pageForm.metaTitle || pageForm.label || pageForm.path || "Page title"}
                </p>
                <p className="truncate text-sm text-emerald-800">
                  {pageForm.canonicalUrl ||
                    `${(settings.siteUrl || CLIENT_SITE).replace(/\/+$/, "")}${pageForm.path}`}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {pageForm.metaDescription || "Your page description will appear here."}
                </p>
              </section>

              <div className="flex flex-wrap gap-3">
                <button
                  className={primaryButton}
                  disabled={pageSaving || pagesLoading || Boolean(pageSchemaError)}
                >
                  {pageSaving ? "Saving…" : "Save page SEO"}
                </button>
                {pageForm._id && (
                  <button
                    type="button"
                    className={`${button} border border-red-200 bg-white text-red-700 hover:bg-red-50`}
                    disabled={pageSaving}
                    onClick={deletePage}
                  >
                    Delete SEO entry
                  </button>
                )}
              </div>
              </form>
            ) : (
              <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <p className="text-lg font-semibold text-slate-700">
                    Choose a section to manage its SEO
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Select Services or Digital Marketing to see only pages from that section.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {tab === "sitemap" && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Sitemap and robots</h2>
              <p className="mt-1 text-sm text-slate-500">
                Published CMS pages and indexable paths are cached for up to one hour.
              </p>
            </div>
            <button
              type="button"
              className={primaryButton}
              disabled={sitemapBusy || sitemapLoading}
              onClick={regenerateSitemap}
            >
              {sitemapBusy ? "Regenerating…" : "Regenerate sitemap"}
            </button>
          </div>
          {sitemapLoading && (
            <p className="text-sm text-slate-500">Loading sitemap entries…</p>
          )}
          {sitemap && (
            <>
              <div className="flex flex-wrap gap-3">
                <a
                  href={sitemapPreview}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryButton}
                >
                  Preview sitemap.xml ↗
                </a>
                <a
                  href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(sitemap.siteUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryButton}
                >
                  Submit in Google Search Console ↗
                </a>
                <a
                  href={`${sitemap.siteUrl.replace(/\/+$/, "")}/robots.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryButton}
                >
                  Preview robots.txt ↗
                </a>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {sitemap.urls.length} indexable URLs · {sitemap.siteUrl}
              </p>
              <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">URL</th>
                      <th className="px-4 py-3 font-semibold">Last modified</th>
                      <th className="px-4 py-3 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sitemap.urls.map((item) => (
                      <tr className="border-t border-slate-100" key={item.path}>
                        <td className="max-w-[520px] truncate px-4 py-3">
                          <a
                            className="text-indigo-700 hover:underline"
                            href={`${sitemap.siteUrl.replace(/\/+$/, "")}${item.path}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.path}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          {item.lastmod
                            ? new Date(item.lastmod).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.priority}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
