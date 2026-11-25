"use client";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";
import ContentManager from "../../features/catalog/ContentManager";
export default function ServicePage() {
  const { request } = useAdminAuth();
  return <ContentManager section="servicesContent" request={request} />;
}
