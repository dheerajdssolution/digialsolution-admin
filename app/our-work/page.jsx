"use client";
import { useAdminAuth } from "../../components/auth/AdminAuthProvider";
import ContentManager from "../../features/catalog/ContentManager";
export default function OurWorkPage() {
  const { request } = useAdminAuth();
  return <ContentManager section="portfolioContent" request={request} />;
}
