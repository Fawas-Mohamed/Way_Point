export interface AdminUserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  role: { id: string; name: string };
}

export interface AdminRolePermission {
  permission: { id: string; key: string; label: string; domain: string };
}

export interface AdminRoleItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { users: number };
  permissions: AdminRolePermission[];
}

export interface AdminPermissionItem {
  id: string;
  key: string;
  label: string;
  domain: string;
}
