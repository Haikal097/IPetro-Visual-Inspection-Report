import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import UserManagement from '@/components/admin/UserManagement';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'inspector' | 'reviewer' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

interface AdminDashboardProps {
  users: User[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    pendingUsers: number;
  };
}

export default function AdminDashboard({ users, stats }: AdminDashboardProps) {
  return (
    <AdminLayout>
      <Head title="Admin Dashboard | iPetro" />
      
      {/* Stats Cards and Content */}
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and system access</p>
        </div>
        
        <StatsCards stats={stats} />
        
        {/* Main Content */}
        <div className="mt-6">
          <UserManagement users={users} />
        </div>
      </div>
    </AdminLayout>
  );
}