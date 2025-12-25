import { useState } from 'react';
import { 
  Search, UserPlus, Eye, Edit, Lock, Trash2,
  UserCheck, UserX, Mail, Download, Filter,
  AlertCircle, CheckCircle, Activity
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'inspector' | 'reviewer' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

interface UserManagementProps {
  users: User[];
}

export default function UserManagement({ users: initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Helper functions for styling
  const getRoleColor = (role: User['role']) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      inspector: 'bg-blue-100 text-blue-800',
      reviewer: 'bg-purple-100 text-purple-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.viewer;
  };

  const getStatusColor = (status: User['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.inactive;
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleResetPassword = (userId: number) => {
    alert(`Password reset email sent to user ${userId}`);
  };

  const handleAddUser = () => {
    const newId = users.length + 1;
    const newUser: User = {
      id: newId,
      name: `New User ${newId}`,
      email: `user${newId}@ipetro.com`,
      role: 'viewer',
      status: 'pending',
      lastLogin: 'Never'
    };
    setUsers([...users, newUser]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage all user accounts and permissions</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="bg-gradient-to-r from-[#CD202C] to-[#8B0000] hover:from-[#B81C26] hover:to-[#7A0000] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="inspector">Inspector</option>
            <option value="reviewer">Reviewer</option>
            <option value="viewer">Viewer</option>
          </select>
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">User</th>
              <th className="text-left p-4 font-medium text-gray-700">Role</th>
              <th className="text-left p-4 font-medium text-gray-700">Status</th>
              <th className="text-left p-4 font-medium text-gray-700">Last Login</th>
              <th className="text-left p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(user.status)}`}>
                    {user.status === 'active' && <CheckCircle className="w-3 h-3" />}
                    {user.status === 'inactive' && <UserX className="w-3 h-3" />}
                    {user.status === 'pending' && <Activity className="w-3 h-3" />}
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{user.lastLogin}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <button 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      onClick={() => alert(`View details for ${user.name}`)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                      onClick={() => alert(`Edit ${user.name}`)}
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {user.status === 'active' ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      onClick={() => handleResetPassword(user.id)}
                      title="Reset Password"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={handleAddUser}
          className="border border-gray-200 rounded-lg p-4 hover:border-[#CD202C] hover:bg-red-50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-[#CD202C]" />
            <span className="font-medium">Create User</span>
          </div>
        </button>
        <button className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Send Email</span>
          </div>
        </button>
        <button className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all text-left">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-green-500" />
            <span className="font-medium">Export Users</span>
          </div>
        </button>
        <button className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-all text-left">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-purple-500" />
            <span className="font-medium">Advanced Filters</span>
          </div>
        </button>
      </div>

      {/* Role Permissions Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Role Permissions Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded border">
            <div className="font-medium text-red-700 mb-1">Admin</div>
            <div className="text-xs text-gray-600">Full system access & user management</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="font-medium text-blue-700 mb-1">Inspector</div>
            <div className="text-xs text-gray-600">Create & edit inspection reports</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="font-medium text-purple-700 mb-1">Reviewer</div>
            <div className="text-xs text-gray-600">Review and approve reports</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="font-medium text-gray-700 mb-1">Viewer</div>
            <div className="text-xs text-gray-600">Read-only access to reports</div>
          </div>
        </div>
      </div>
    </div>
  );
}