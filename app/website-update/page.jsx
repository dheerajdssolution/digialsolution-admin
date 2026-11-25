import WebsiteUpdateManager from "../../features/website/WebsiteUpdateManager";

export default async function WebsiteUpdatePage({ searchParams }) {
  const params = await searchParams;
  const path = typeof params?.path === "string" ? params.path : "/";
  const mode = typeof params?.mode === "string" ? params.mode : "page";

  return (
    <WebsiteUpdateManager
      key={`${path}:${mode}`}
      initialPath={path}
      initialMode={mode}
    />
  );
}
