"use client";

import { useState } from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_CMS_API_URL || "https://digital-solution-1-h8nk.onrender.com/api"
).replace(/\/$/, "");
const API_ORIGIN = new URL(API_URL).origin;
const CLIENT_SITE = (
  process.env.NEXT_PUBLIC_CLIENT_SITE_URL || "https://www.thedssolution.com"
).replace(/\/$/, "");
const supportedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const maximumSize = 8 * 1024 * 1024;
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function getPreviewUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const origin = value.startsWith("/api/pages/media/") ? API_ORIGIN : CLIENT_SITE;
  return new URL(value, origin).toString();
}

export default function ImageUploadField({
  label = "Image",
  purpose = "",
  value = "",
  onChange,
  request,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setError("");
    if (!supportedTypes.has(file.type)) {
      setError("Choose a JPG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > maximumSize) {
      setError("Image must be 8 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await request("/pages/admin/images", {
        method: "POST",
        body: formData,
      });
      onChange(new URL(result.url, API_ORIGIN).toString());
    } catch (issue) {
      setError(issue.message);
    } finally {
      setUploading(false);
    }
  }

  const previewUrl = getPreviewUrl(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {purpose && (
        <p className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold">Used for:</span> {purpose}
        </p>
      )}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`${label} preview`}
          className="max-h-40 max-w-full rounded-lg border border-slate-200 bg-white object-contain p-2"
        />
      )}
      <input
        className={inputClass}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        disabled={uploading}
        onChange={upload}
      />
      <p className="text-xs text-slate-500">
        {uploading
          ? "Uploading image…"
          : "Choose a JPG, PNG, GIF, or WebP file (8 MB max). Upload it, then save this record to keep the image."}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
