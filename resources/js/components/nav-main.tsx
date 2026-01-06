import { useEffect, useMemo, useState } from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

function cleanPath(url: string) {
  return (url || '').split('?')[0].replace(/\/+$/, '') || '/';
}

function isActivePath(currentUrl: string, href?: string) {
  if (!href) return false;

  const current = cleanPath(currentUrl);
  const target = cleanPath(resolveUrl(href));

  if (current === target) return true;

  // "/review" matches "/review/123" but NOT "/reviewer/report"
  return current.startsWith(target + '/');
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const page = usePage();
  const currentUrl = page.url;

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem key={item.title} item={item} currentUrl={currentUrl} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMainItem({
  item,
  currentUrl,
}: {
  item: NavItem;
  currentUrl: string;
}) {
  const hasChildren = !!item.children?.length;

  const childActive = useMemo(() => {
    if (!hasChildren) return false;
    return item.children!.some((c) => isActivePath(currentUrl, c.href));
  }, [hasChildren, item.children, currentUrl]);

  const parentActive = isActivePath(currentUrl, item.href);
  const active = parentActive || childActive;

  // auto-open when a child is active
  const [open, setOpen] = useState(childActive);

  // ✅ keep dropdown in sync when route changes (important!)
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  // normal single link item
  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={{ children: item.title }}
        >
          <Link href={item.href!} prefetch>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // dropdown parent item (✅ parent click goes to href, chevron toggles)
  return (
    <>
      <SidebarMenuItem>
        <div className="flex w-full items-center">
          {/* ✅ Parent label navigates to main page (e.g. /reports) */}
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={{ children: item.title }}
            className="flex-1"
          >
            <Link href={item.href ?? '#'} prefetch>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>

          {/* ✅ Chevron toggles dropdown ONLY (doesn't navigate) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted/60"
            aria-label={`Toggle ${item.title}`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </SidebarMenuItem>

      {/* children */}
      {open &&
        item.children!.map((child) => {
          const childIsActive = isActivePath(currentUrl, child.href);

          return (
            <SidebarMenuItem key={child.title} className="ml-4">
              <SidebarMenuButton
                asChild
                isActive={childIsActive}
                tooltip={{ children: child.title }}
              >
                <Link href={child.href!} prefetch>
                  {child.icon && <child.icon />}
                  <span>{child.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
    </>
  );
}
