import { Link } from "@inertiajs/react";
import type { BreadcrumbItem } from "@/types";
import NotificationBell from "@/components/NotificationBell";

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        {breadcrumbs.length ? (
          breadcrumbs.map((b, idx) => (
            <div key={b.href} className="flex items-center gap-2">
              <Link href={b.href} className="hover:underline">
                {b.title}
              </Link>
              {idx < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
            </div>
          ))
        ) : (
          <span className="font-medium text-gray-900 dark:text-white">Dashboard</span>
        )}
      </div>

      {/* Right: Bell */}
      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>
    </header>
  );
}
