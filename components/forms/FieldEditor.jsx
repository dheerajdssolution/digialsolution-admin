"use client";

import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const humanize = (value) =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const copy = (value) => JSON.parse(JSON.stringify(value));

function emptyArrayItem(field, example) {
  if (example !== undefined) return copy(example);
  if (field === "images") return { src: "", alt: "" };
  if (["testimonials", "members", "items", "plans"].includes(field))
    return { title: "", description: "", content: "" };
  return "";
}

export default function FieldEditor({ name, value, onChange, depth = 0 }) {
  const [addingField, setAddingField] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");

  if (Array.isArray(value))
    return (
      <fieldset
        className={`space-y-3 rounded-2xl border border-slate-200 p-4 ${depth ? "bg-slate-50/70" : "bg-white"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">
            {humanize(name)}{" "}
            <span className="font-normal text-slate-400">({value.length})</span>
          </legend>
          <button
            type="button"
            onClick={() => onChange([...value, emptyArrayItem(name, value[0])])}
            className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            ＋ Add item
          </button>
        </div>
        {value.map((item, index) => (
          <div
            key={index}
            className="relative rounded-xl border border-slate-200 bg-white p-3 pr-12"
          >
            <FieldEditor
              name={`${humanize(name)} ${index + 1}`}
              value={item}
              depth={depth + 1}
              onChange={(next) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index ? next : current,
                  ),
                )
              }
            />
            <button
              type="button"
              aria-label={`Delete ${humanize(name)} ${index + 1}`}
              onClick={() =>
                onChange(value.filter((_, itemIndex) => itemIndex !== index))
              }
              className="absolute top-3 right-3 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ))}
      </fieldset>
    );

  if (value && typeof value === "object")
    return (
      <fieldset
        className={`space-y-4 rounded-2xl border border-slate-200 p-4 ${depth ? "bg-slate-50/70" : "bg-white"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">
            {humanize(name)}
          </legend>
          <button
            type="button"
            onClick={() => setAddingField((current) => !current)}
            className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            ＋ Add field
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(value).map(([key, child]) => (
            <div
              key={key}
              className={
                Array.isArray(child) ||
                (child && typeof child === "object") ||
                (typeof child === "string" && child.length > 120)
                  ? "sm:col-span-2"
                  : ""
              }
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <FieldEditor
                    name={key}
                    value={child}
                    depth={depth + 1}
                    onChange={(next) => onChange({ ...value, [key]: next })}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${humanize(key)}`}
                  onClick={() => {
                    const next = { ...value };
                    delete next[key];
                    onChange(next);
                  }}
                  className="mt-7 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        {addingField && (
          <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_150px_auto]">
            <input
              className={fieldClass}
              value={fieldName}
              onChange={(event) => setFieldName(event.target.value)}
              placeholder="Field name"
            />
            <select
              className={fieldClass}
              value={fieldType}
              onChange={(event) => setFieldType(event.target.value)}
            >
              <option value="text">Text</option>
              <option value="long">Long text</option>
              <option value="number">Number</option>
              <option value="boolean">On / off</option>
              <option value="object">Nested fields</option>
              <option value="array">List / cards</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const key = fieldName.trim().replaceAll(" ", "_");
                if (!key || Object.hasOwn(value, key)) return;
                const defaults = {
                  text: "",
                  long: "",
                  number: 0,
                  boolean: false,
                  object: {},
                  array: [],
                };
                onChange({ ...value, [key]: defaults[fieldType] });
                setFieldName("");
                setAddingField(false);
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Add
            </button>
          </div>
        )}
      </fieldset>
    );

  const id = `field-${name.replace(/[^a-z0-9]+/gi, "-")}`;
  if (typeof value === "boolean")
    return (
      <label
        htmlFor={id}
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700"
      >
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        {humanize(name)}
      </label>
    );
  if (typeof value === "number")
    return (
      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        {humanize(name)}
        <input
          className={fieldClass}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  const text = value ?? "";
  const isLong =
    String(text).length > 120 ||
    String(text).includes("\n") ||
    [
      "content",
      "description",
      "subtitle",
      "summary",
      "letter",
      "body",
      "answer",
    ].some((word) => name.toLowerCase().includes(word));
  return (
    <label className="block space-y-1.5 text-sm font-medium text-slate-700">
      {humanize(name)}
      {isLong ? (
        <textarea
          className={fieldClass}
          rows={String(text).length > 350 ? 8 : 4}
          value={String(text)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={fieldClass}
          value={String(text)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
