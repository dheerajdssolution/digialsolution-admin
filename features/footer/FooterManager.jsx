"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";

const textInput = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const footerFields = [
  ["brandName", "Copyright / brand name"], ["tagline", "Brand tagline"], ["description", "Brand description"],
  ["email", "Contact email"], ["phone", "Contact phone"], ["address", "Office address"],
  ["city", "City"], ["region", "State / region"], ["country", "Country"], ["hours", "Office hours"],
  ["ctaTitle", "CTA heading"], ["ctaText", "CTA description"], ["ctaButtonLabel", "CTA button label"], ["ctaButtonUrl", "CTA button link"],
];
const emptyLink = { name: "", url: "" };

function LinkList({ title, links = [], onChange }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs text-slate-500">Add, edit or remove footer links.</p></div><button type="button" onClick={() => onChange([...links, { ...emptyLink }])} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">＋ Add link</button></div><div className="space-y-3">{links.map((link, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1.4fr_auto]"><input className={textInput} aria-label={`${title} link name`} placeholder="Link label" value={link.name || ""} onChange={(event) => onChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><input className={textInput} aria-label={`${title} link URL`} placeholder="/page or https://..." value={link.url || ""} onChange={(event) => onChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} /><button type="button" onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button></div>)}{!links.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">No links configured.</p>}</div></section>;
}

export default function FooterManager() {
  const { request } = useAdminAuth();
  const [footer, setFooter] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => { const result = await request("/footer/admin"); setFooter(result.footer); }, [request]);
  useEffect(() => { refresh().catch((issue) => setError(issue.message)); }, [refresh]);
  function update(field, value) { setFooter((current) => ({ ...current, [field]: value })); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const result = await request("/footer/admin", { method: "PUT", body: JSON.stringify(footer) }); setFooter(result.footer); setNotice("Footer updates are saved and will appear on the client site."); }
    catch (issue) { setError(issue.message); } finally { setBusy(false); }
  }
  async function reset() {
    if (!window.confirm("Reset footer content to the project defaults?")) return;
    try { const result = await request("/footer/admin", { method: "DELETE" }); setFooter(result.footer); setNotice("Footer reset to project defaults."); }
    catch (issue) { setError(issue.message); }
  }

  if (!footer) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading footer settings…</div>;
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-indigo-600">Client footer</p><h1 className="mt-1 text-3xl font-bold">Footer management</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Manage the footer brand, CTA, contact and location details, and each link group. Updates are delivered to the client through the footer API.</p></header>{(error || notice) && <p className={`rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
    <form onSubmit={save} className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-4 font-bold">Brand, contact and location</h2><div className="grid gap-4 sm:grid-cols-2">{footerFields.slice(0, 10).map(([field, label]) => <div key={field} className={field === "description" || field === "address" || field === "tagline" ? "sm:col-span-2" : ""}><label>{label}</label>{["description", "address", "tagline"].includes(field) ? <textarea className={textInput} rows={field === "description" ? 3 : 2} maxLength={2000} value={footer[field] || ""} onChange={(event) => update(field, event.target.value)} /> : <input className={textInput} value={footer[field] || ""} onChange={(event) => update(field, event.target.value)} />}</div>)}</div><p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">Footer location: {[footer.city, footer.region, footer.country].filter(Boolean).join(", ") || "Not set"}</p></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-4 font-bold">Footer call to action</h2><div className="grid gap-4 sm:grid-cols-2">{footerFields.slice(10).map(([field, label]) => <div key={field} className={field === "ctaText" ? "sm:col-span-2" : ""}><label>{label}</label>{field === "ctaText" ? <textarea className={textInput} rows={3} value={footer[field] || ""} onChange={(event) => update(field, event.target.value)} /> : <input className={textInput} value={footer[field] || ""} onChange={(event) => update(field, event.target.value)} />}</div>)}</div></section>
      <LinkList title="Explore links" links={footer.exploreLinks} onChange={(value) => update("exploreLinks", value)} /><LinkList title="Service links" links={footer.serviceLinks} onChange={(value) => update("serviceLinks", value)} /><LinkList title="Legal links" links={footer.legalLinks} onChange={(value) => update("legalLinks", value)} /><LinkList title="Social links" links={footer.socialLinks} onChange={(value) => update("socialLinks", value)} />
      <div className="sticky bottom-0 flex justify-between border-t border-slate-200 bg-[#f5f7fb]/95 py-4 backdrop-blur"><button type="button" onClick={reset} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">Reset defaults</button><button disabled={busy} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save footer"}</button></div>
    </form>
  </div>;
}
