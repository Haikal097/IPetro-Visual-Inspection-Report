import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Folder, LayoutGrid, Image, FileText, Shield, Users, Calendar } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect } from 'react';

const inspectorNav: NavItem[] = [
  { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
  { title: 'Photos', href: '/photo', icon: Image },

    {
    title: 'Report',
    href: '/reports', // ✅ must exist
    icon: FileText,
    children: [
      { title: 'PV Report', href: '/pv-report', icon: FileText },
      { title: 'Equipment Templates', href: '/equipment-templates', icon: Folder },
    ],
  },

  { title: 'Calendar', href: '/calendar', icon: Calendar },
];


const reviewerNav: NavItem[] = [
  { title: 'Dashboard', href: '/review', icon: LayoutGrid },
];

const adminNav: NavItem[] = [
  { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Reports', href: '/reports', icon: FileText },
  { title: 'Photos', href: '/photo', icon: Image },
  { title: 'Settings', href: '/admin/settings', icon: Folder },
];

const footerNavItems: NavItem[] = [];



export function AppSidebar() {
  const page = usePage();

  // Your Inertia props show: auth.role = "admin"
  const auth = (page.props as any)?.auth ?? {};
  const roleRaw = auth?.role ?? auth?.user?.role ?? 'unknown';
  const role = String(roleRaw).toLowerCase();

  const isAdmin = role === 'admin';
  const isReviewer = role === 'reviewer';
  const isInspector = role === 'inspector';

  const mainNavItems: NavItem[] = isAdmin
    ? adminNav
    : isReviewer
    ? reviewerNav
    : inspectorNav;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={dashboard()} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
