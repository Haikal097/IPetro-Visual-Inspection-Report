import { Link } from '@inertiajs/react';
import { 
  Home, 
  Users, 
  Shield, 
  Settings, 
  BarChart3,
  FileText,
  Factory,
  Bell,
  LogOut,
  Target,
  Database,
  Key,
  Cpu
} from 'lucide-react';

interface AdminSidebarProps {
  currentPath: string;
}

export default function AdminSidebar({ currentPath }: AdminSidebarProps) {
  const navItems = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
  ];

  /*
    { href: '/admin/roles', icon: Shield, label: 'Roles & Permissions' },
    { href: '/admin/reports', icon: FileText, label: 'Reports' },
    { href: '/admin/assets', icon: Factory, label: 'Assets' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' }, 

    

  const systemItems = [
    { href: '/admin/audit', icon: Database, label: 'Audit Logs' },
    { href: '/admin/security', icon: Key, label: 'Security' },
    { href: '/admin/system', icon: Cpu, label: 'System Health' },
  ];
*/

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 z-30">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CD202C] to-[#8B0000] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">iPetro</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
          Navigation
        </h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#CD202C]/20 to-[#8B0000]/10 text-white border-l-4 border-[#CD202C]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Section 
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-3">
          System
        </h3>
        <nav className="space-y-1">
          {systemItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-white border-l-4 border-blue-500' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>*/}
      </div>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CD202C] to-[#8B0000] flex items-center justify-center">
              <span className="text-white font-medium">A</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">admin@ipetro.com</p>
            </div>
          </div>
          <Link 
            href="/logout" 
            method="post"
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </aside>
  );
}