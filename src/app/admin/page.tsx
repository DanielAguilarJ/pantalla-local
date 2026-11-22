import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";
import { LoginForm } from "@/components/admin/LoginForm";
import { loadAdminState } from "@/lib/admin-state";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Pantalla Local",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const configured = !!process.env.ADMIN_PASSWORD;
  if (!configured || !(await isAdmin())) return <LoginForm configured={configured} />;
  return <AdminApp initial={await loadAdminState()} />;
}
