import "./globals.css";
import { AdminAuthProvider } from "../components/auth/AdminAuthProvider";
import AdminShell from "../components/layout/AdminShell";

export const metadata = {
  title: "DS Solution | Content Admin",
  description: "Manage website pages and SEO metadata.",
  icons: { icon: "/Dssolution-logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
