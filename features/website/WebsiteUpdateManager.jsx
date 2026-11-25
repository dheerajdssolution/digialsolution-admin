"use client";

import { useEffect, useState } from "react";
import { headerPages } from "../../config/headerPages";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";
import ContentManager from "../catalog/ContentManager";
import ServiceIndustryManager from "../catalog/ServiceIndustryManager";
import PageManager from "../pages/PageManager";

export default function WebsiteUpdateManager({
  initialPath = "/",
  initialMode = "page",
}) {
  const { request } = useAdminAuth();
  const [selectedPath, setSelectedPath] = useState(() =>
    headerPages.some((item) => item.path === initialPath) ? initialPath : "/",
  );
  const [mode, setMode] = useState(() =>
    initialMode === "items" ? "items" : "page",
  );
  const selected =
    headerPages.find((item) => item.path === selectedPath) || headerPages[0];

  const hasCatalog = Boolean(selected.catalog);
  const catalogManager = ["servicesContent", "industriesContent"].includes(
    selected.catalog,
  ) ? (
    <ServiceIndustryManager
      key={selected.catalog}
      section={
        selected.catalog === "servicesContent" ? "services" : "industries"
      }
      request={request}
    />
  ) : (
    <ContentManager
      key={selected.catalog}
      section={selected.catalog}
      request={request}
    />
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Website content</p>
        <h1 className="mt-1 text-3xl font-bold">{selected.label} management</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Manage the {selected.label} page here. Use the client-page links in
          the sidebar to switch pages; the page-card overview is available on
          Dashboard.
        </p>
      </header>
      {hasCatalog && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <p className="font-semibold text-slate-800">
              {selected.label} controls
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Manage the page layout or its published items.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setMode("page")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "page" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              Page content
            </button>
            <button
              onClick={() => setMode("items")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === "items" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              Items CRUD
            </button>
          </div>
        </div>
      )}
      {mode === "items" && hasCatalog ? (
        catalogManager
      ) : (
        <PageManager
          key={`${selected.section}-${selected.routePath || selected.path}`}
          section={selected.section}
          routePath={selected.routePath || selected.path}
          routeLabel={selected.label}
          hideSEO
          hideList
        />
      )}
    </div>
  );
}
