"use client";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";
import ContentManager from "../../features/catalog/ContentManager";
export default function BlogPage() {
  const { request } = useAdminAuth();
  return <ContentManager section="blogContent" request={request} />;
}
