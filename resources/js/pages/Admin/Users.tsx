import { Head } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import UserManagement from "@/components/admin/UserManagement";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "inspector" | "reviewer";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  signature_path?: string;
  signature_updated_at?: string;
  email_verified_at?: string;
  two_factor_secret?: string;
  two_factor_recovery_codes?: string;
  two_factor_confirmed_at?: string;
  remember_token?: string;
}

interface Props {
  users: User[];
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

export default function AdminUsers(props: Props) {
  return (
    <AdminLayout>
      <Head title="User Management | iPetro" />

      <UserManagement
        users={props.users}
        totalUsers={props.totalUsers}
        activeUsers={props.activeUsers}
        inactiveUsers={props.inactiveUsers}
      />
    </AdminLayout>
  );
}
