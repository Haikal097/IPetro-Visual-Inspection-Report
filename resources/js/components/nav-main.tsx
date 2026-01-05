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

function cleanPath(url: string) {
  // remove query + trailing slash
  return (url || '').split('?')[0].replace(/\/+$/, '') || '/';
}

function isActivePath(currentUrl: string, href: string) {
  const current = cleanPath(currentUrl);
  const target = cleanPath(resolveUrl(href));

  // exact match
  if (current === target) return true;

  // segment boundary match: "/review" matches "/review/123" but NOT "/reviewer/report"
  return current.startsWith(target + '/');
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const page = usePage();
  const currentUrl = page.url;

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const active = isActivePath(currentUrl, item.href);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={{ children: item.title }}
              >
                <Link href={item.href} prefetch>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
