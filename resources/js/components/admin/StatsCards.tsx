import { Users, UserCheck, UserPlus, UserX, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    pendingUsers: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="p-3 rounded-full bg-red-50">
            <Users className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+12% from last month</span>
        </div>
      </div>

      {/* Active Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
          </div>
          <div className="p-3 rounded-full bg-green-50">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Currently online
          </div>
        </div>
      </div>

      {/* New Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">New Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.newUsers}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-50">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Last 7 days
        </div>
      </div>

      {/* Pending Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingUsers}</p>
          </div>
          <div className="p-3 rounded-full bg-yellow-50">
            <UserX className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Awaiting approval
        </div>
      </div>
    </div>
  );
}