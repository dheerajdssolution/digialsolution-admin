"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";

const PAGE_SIZE = 50;

export default function ContactInbox() {
  const { request } = useAdminAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request(
        `/contact-submissions/admin?page=${page}&limit=${PAGE_SIZE}`,
      );
      setData(result);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setLoading(false);
    }
  }, [page, request]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pages = Math.max(1, data?.pages || 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Client inbox</p>
          <h1 className="mt-1 text-3xl font-bold">Contact Messages</h1>
          <p className="mt-2 text-sm text-slate-500">
            Messages submitted through the client website contact form.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-indigo-300 disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading contact messages…
        </div>
      ) : !data?.submissions?.length ? (
        !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="font-semibold">No contact messages yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              New messages from the client contact page will appear here.
            </p>
          </div>
        )
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {data.total} {data.total === 1 ? "message" : "messages"}
          </p>
          <div className="space-y-4">
            {data.submissions.map((submission) => (
              <article
                key={submission._id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    {submission.name}
                  </h2>
                  <time
                    className="text-xs text-slate-500"
                    dateTime={submission.createdAt}
                  >
                    {new Date(submission.createdAt).toLocaleString()}
                  </time>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <a
                    className="text-indigo-700 hover:underline"
                    href={`mailto:${submission.email}`}
                  >
                    {submission.email}
                  </a>
                  <a
                    className="text-indigo-700 hover:underline"
                    href={`tel:${submission.phone}`}
                  >
                    {submission.phone}
                  </a>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {submission.message}
                </p>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              disabled={page >= pages || loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
