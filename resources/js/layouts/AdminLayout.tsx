import { ReactNode, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { usePage } from "@inertiajs/react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ FIX: usePage() returns a Page object, not { url }
  const page = usePage() as any;
  const url: string = page?.url ?? window.location.pathname;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={url}
      />

      {/* Main Content */}
      <div
        className={`
          transition-all duration-300 min-h-screen
          ${sidebarCollapsed ? "ml-20" : "ml-64"}
        `}
      >
        {children}
      </div>
    </div>
  );
}
