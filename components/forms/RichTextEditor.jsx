"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_CMS_API_URL || "https://digital-solution-1-h8nk.onrender.com/api"
).replace(/\/$/, "");
const API_ORIGIN = new URL(API_URL).origin;
const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const maximumImageSize = 8 * 1024 * 1024;

const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "DIV",
  "EM",
  "FIGCAPTION",
  "FIGURE",
  "HR",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "I",
  "IMG",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "SUB",
  "SECTION",
  "DETAILS",
  "SUMMARY",
  "SUP",
  "U",
  "UL",
]);

function isSafeHref(value) {
  return /^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#|\.\/|[a-z0-9][a-z0-9._/-]*(?:[?#]|$))/i.test(
    String(value || "").trim(),
  );
}

function sanitizeEditorHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value || "");

  function clean(parent) {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (!allowedTags.has(node.tagName)) {
        node.replaceWith(...node.childNodes);
        return;
      }

      [...node.attributes].forEach((attribute) => {
        const keepClass =
          attribute.name === "class" &&
          /^[\w\s:-]{1,300}$/.test(attribute.value);
        const keepLink =
          node.tagName === "A" &&
          ["href", "title"].includes(attribute.name) &&
          (attribute.name !== "href" || isSafeHref(attribute.value));
        const keepImage =
          node.tagName === "IMG" &&
          ["src", "alt", "title", "width", "height", "loading"].includes(
            attribute.name,
          ) &&
          (attribute.name !== "src" || isSafeHref(attribute.value));
        if (!keepClass && !keepLink && !keepImage)
          node.removeAttribute(attribute.name);
      });
      if (node.tagName === "A" && !node.hasAttribute("href")) {
        node.replaceWith(...node.childNodes);
        return;
      }
      clean(node);
    });
  }

  clean(template.content);
  return template.innerHTML;
}

export default function RichTextEditor({
  value,
  onChange,
  request,
  imagePurpose = "inline in this content",
}) {
  const editor = useRef(null);
  const imageInput = useRef(null);
  const savedSelection = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!editor.current) return;
    const safeHtml = sanitizeEditorHtml(value);
    if (editor.current.innerHTML !== safeHtml)
      editor.current.innerHTML = safeHtml;
  }, [value]);

  function emitChange() {
    if (!editor.current) return;
    const html = sanitizeEditorHtml(editor.current.innerHTML);
    if (html !== editor.current.innerHTML) editor.current.innerHTML = html;
    onChange(html, editor.current.innerText);
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editor.current?.contains(selection.anchorNode)
    )
      savedSelection.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    editor.current?.focus();
    const range = savedSelection.current;
    if (!range || !editor.current?.contains(range.commonAncestorContainer))
      return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function command(name, argument) {
    restoreSelection();
    document.execCommand(name, false, argument);
    rememberSelection();
    emitChange();
  }

  function setBlock(tag) {
    command("formatBlock", `<${tag}>`);
  }

  function addLink() {
    rememberSelection();
    if (!savedSelection.current?.toString()) {
      window.alert("Select the text you want to make a link first.");
      return;
    }
    const href = window.prompt("Enter the link URL");
    if (href === null || !href.trim()) return;
    if (!isSafeHref(href)) {
      window.alert("Use a web URL, mailto, tel, or site-relative path.");
      return;
    }
    restoreSelection();
    document.execCommand("createLink", false, href.trim());
    rememberSelection();
    emitChange();
  }

  async function uploadImage(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setImageError("");
    if (!supportedImageTypes.has(file.type)) {
      setImageError("Choose a JPG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > maximumImageSize) {
      setImageError("Image must be 8 MB or smaller.");
      return;
    }
    if (!request) {
      setImageError("Image upload is unavailable in this editor.");
      return;
    }

    const alt = window.prompt(
      "Add alt text for accessibility (optional).",
      file.name.replace(/\.[^.]+$/, ""),
    );
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await request("/pages/admin/images", {
        method: "POST",
        body: formData,
      });
      if (!result.url) throw new Error("The uploaded image URL was not returned.");

      restoreSelection();
      const image = document.createElement("img");
      image.src = new URL(result.url, API_ORIGIN).toString();
      image.alt = alt ?? "";
      image.loading = "lazy";
      document.execCommand("insertHTML", false, image.outerHTML);
      rememberSelection();
      emitChange();
    } catch (issue) {
      setImageError(issue.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  const buttonClass =
    "rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-700";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2"
        aria-label="Text formatting toolbar"
      >
        <select
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
          defaultValue="p"
          aria-label="Paragraph style"
          onChange={(event) => setBlock(event.target.value)}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
          <option value="blockquote">Quote</option>
        </select>
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => command("bold")} aria-label="Bold" title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => command("italic")} aria-label="Italic" title="Italic">
          <em>I</em>
        </button>
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => command("underline")} aria-label="Underline" title="Underline">
          <u>U</u>
        </button>
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => command("insertUnorderedList")} title="Bulleted list">
          • List
        </button>
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => command("insertOrderedList")} title="Numbered list">
          1. List
        </button>
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={addLink} title="Insert link">
          Link
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={uploadingImage}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            rememberSelection();
            imageInput.current?.click();
          }}
          title={`Upload an image ${imagePurpose}`}
        >
          {uploadingImage ? "Uploading…" : "Insert inline image"}
        </button>
        <input
          ref={imageInput}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={uploadImage}
          aria-label="Choose an image to insert"
        />
        <button type="button" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => command("removeFormat")} title="Clear formatting">
          Clear
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Page content rich text editor"
        className="min-h-28 max-h-80 overflow-y-auto px-3 py-2.5 text-sm outline-none [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3"
        onInput={emitChange}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onDrop={(event) => {
          event.preventDefault();
          const text = event.dataTransfer.getData("text/plain");
          if (text) {
            editor.current?.focus();
            document.execCommand("insertText", false, text);
          }
        }}
      />
      <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
        Select text to format it. Place the cursor where the image should go,
        then choose Insert inline image. This upload is {imagePurpose}.
      </p>
      {imageError && (
        <p role="alert" className="border-t border-red-100 px-3 py-2 text-xs text-red-600">
          {imageError}
        </p>
      )}
    </div>
  );
}
