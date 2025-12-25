import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
  Users, Search, UserPlus, Eye, Edit, Lock, Trash2,
  UserCheck, UserX, Mail, Download, Filter, CheckCircle,
  AlertCircle, Activity, MoreVertical, Shield, Calendar,
  Phone, Building, MapPin, X, Save, RefreshCw, Ban,
  Mail as MailIcon, Key, Globe, Clock, User
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';


interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'inspector' | 'reviewer' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
  avatarColor?: string;
}

interface UserManagementProps {
  users: User[];
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

export default function UserManagement({ 
  users: initialUsers, 
  totalUsers, 
  activeUsers,
  inactiveUsers
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Inertia form for creating/updating users
  const userForm = useForm({
    name: '',
    email: '',
    phone: '',
    role: 'viewer' as User['role'],
    status: 'pending' as User['status'],
  });

  // Filter users (client-side filtering for now)
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.phone && user.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Helper functions (same as before)
  const getRoleColor = (role: User['role']) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      inspector: 'bg-blue-100 text-blue-800 border-blue-200',
      reviewer: 'bg-purple-100 text-purple-800 border-purple-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || colors.viewer;
  };

  const getStatusColor = (status: User['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      suspended: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.inactive;
  };

const getStatusIcon = (status: User['status']) => {
    switch(status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <UserX className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'suspended': return <Ban className="w-4 h-4" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };

  // User actions using Inertia
  const handleToggleStatus = (userId: number, newStatus?: User['status']) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const targetStatus = newStatus || (user.status === 'active' ? 'inactive' : 'active');
    
    router.patch(route('admin.users.updateStatus', { user: userId }), {
      status: targetStatus
    }, {
      onSuccess: () => {
        // Update local state on success
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: targetStatus } : u
        ));
      }
    });
  };

  const handleDeleteUser = (userId: number) => {
    router.delete(route('admin.users.destroy', { user: userId }), {
      onSuccess: () => {
        // Remove from local state
        setUsers(users.filter(user => user.id !== userId));
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      }
    });
  };

  const handleResetPassword = (userId: number) => {
    if (confirm('Are you sure you want to reset this user\'s password?')) {
      router.post(route('admin.users.resetPassword', { user: userId }), {}, {
        onSuccess: () => {
          alert('Password reset email has been sent to the user.');
        }
      });
    }
  };

  const handleAddUser = () => {
    userForm.reset();
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    userForm.setData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      // Update existing user
      router.put(route('admin.users.update', { user: editingUser.id }), userForm.data(), {
        onSuccess: () => {
          setShowUserModal(false);
          setEditingUser(null);
          userForm.reset();
          // Refresh page to get updated data
          router.reload();
        }
      });
    } else {
      // Create new user
      router.post(route('admin.users.store'), userForm.data(), {
        onSuccess: () => {
          setShowUserModal(false);
          userForm.reset();
          // Refresh page to get updated data
          router.reload();
        }
      });
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    if (bulkAction === 'delete' && !confirm(`Delete ${selectedUsers.length} selected users?`)) {
      return;
    }

    router.post(route('admin.users.bulkActions'), {
      user_ids: selectedUsers,
      action: bulkAction,
    }, {
      onSuccess: () => {
        setBulkAction('');
        setSelectedUsers([]);
        // Refresh page to get updated data
        router.reload();
      }
    });
  };


  const toggleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user.id));
    }
  };

  const getRandomColor = () => {
    const colors = ['#CD202C', '#8B0000', '#1e40af', '#7c3aed', '#059669'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <AdminLayout>
      <Head title="User Management | iPetro" />
      
      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage all user accounts, roles, and permissions</p>
            </div>
            <button 
              onClick={handleAddUser}
              className="bg-gradient-to-r from-[#CD202C] to-[#8B0000] hover:from-[#B81C26] hover:to-[#7A0000] text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Add New User
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
            </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
            </div>
            <div className="p-3 rounded-full bg-green-50">
                <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-3xl font-bold text-gray-900">{inactiveUsers}</p>
            </div>
            <div className="p-3 rounded-full bg-gray-50">
                <UserX className="w-6 h-6 text-gray-600" />
            </div>
            </div>
        </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">{selectedUsers.length}</span>
              </div>
              <span className="text-blue-800 font-medium">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Bulk Actions</option>
                <option value="activate">Activate Selected</option>
                <option value="deactivate">Deactivate Selected</option>
                <option value="send_email">Send Email</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button 
                onClick={handleBulkAction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                disabled={!bulkAction}
              >
                Apply
              </button>
              <button 
                onClick={() => setSelectedUsers([])}
                className="text-gray-600 hover:text-gray-800 px-3 py-2"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent placeholder-gray-400 text-gray-800" // Added text-gray-800
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-[#CD202C] focus:border-transparent text-gray-700"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="inspector">Inspector</option>
                <option value="reviewer">Reviewer</option>
                <option value="viewer">Viewer</option>
              </select>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-[#CD202C] focus:border-transparent text-gray-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">User</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.length > 0 ? currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: user.avatarColor || getRandomColor() }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MailIcon className="w-3 h-3" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleColor(user.role)} flex items-center gap-2 w-fit`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role === 'inspector' && <User className="w-3 h-3" />}
                        {user.role === 'reviewer' && <CheckCircle className="w-3 h-3" />}
                        {user.role === 'viewer' && <Eye className="w-3 h-3" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 w-fit ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setUserToDelete(user.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No users found matching your criteria</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 p-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 border rounded-lg ${
                        currentPage === pageNum
                          ? 'border-[#CD202C] bg-red-50 text-[#CD202C]'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h2>
                  <button 
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
                      userForm.reset();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
                        value={userForm.data.name}
                        onChange={(e) => userForm.setData('name', e.target.value)}
                        required
                      />
                      {userForm.errors.name && (
                        <p className="text-red-500 text-sm mt-1">{userForm.errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
                        value={userForm.data.email}
                        onChange={(e) => userForm.setData('email', e.target.value)}
                        required
                      />
                      {userForm.errors.email && (
                        <p className="text-red-500 text-sm mt-1">{userForm.errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
                        value={userForm.data.phone}
                        onChange={(e) => userForm.setData('phone', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
                        value={userForm.data.role}
                        onChange={(e) => userForm.setData('role', e.target.value as User['role'])}
                        required
                      >
                        <option value="admin">Administrator</option>
                        <option value="inspector">Inspector</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD202C] focus:border-transparent"
                        value={userForm.data.status}
                        onChange={(e) => userForm.setData('status', e.target.value as User['status'])}
                        required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserModal(false);
                        setEditingUser(null);
                        userForm.reset();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={userForm.processing}
                      className="px-4 py-2 bg-[#CD202C] text-white rounded-lg hover:bg-[#B81C26] flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {userForm.processing ? 'Saving...' : 'Save User'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete User
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}