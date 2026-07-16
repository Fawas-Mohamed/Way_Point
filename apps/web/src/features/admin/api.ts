import { apiClient } from "@/lib/api-client";
import type { AdminPermissionItem, AdminRoleItem, AdminUserItem } from "./types";
import type { AdminCreateUserInput, AdminUpdateUserInput, ListUsersQuery } from "@waypoint/types";

type ListResponse<T> = { items: T[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export const adminApi = {
  async users(params: ListUsersQuery) {
    const res = await apiClient.get<{ data: ListResponse<AdminUserItem> }>("/users", { params });
    return res.data.data;
  },
  async createUser(input: AdminCreateUserInput) {
    const res = await apiClient.post<{ data: { user: AdminUserItem } }>("/users", input);
    return res.data.data.user;
  },
  async updateUser(userId: string, input: AdminUpdateUserInput) {
    const res = await apiClient.patch<{ data: { user: AdminUserItem } }>(`/users/${userId}`, input);
    return res.data.data.user;
  },
  async deactivateUser(userId: string) {
    await apiClient.delete(`/users/${userId}`);
  },
  async roles() {
    const res = await apiClient.get<{ data: { roles: AdminRoleItem[] } }>("/roles");
    return res.data.data.roles;
  },
  async permissions() {
    const res = await apiClient.get<{ data: { permissions: AdminPermissionItem[] } }>("/roles/permissions");
    return res.data.data.permissions;
  },
  async grantPermission(roleId: string, permissionId: string) {
    await apiClient.post(`/roles/${roleId}/permissions`, { permissionId });
  },
  async revokePermission(roleId: string, permissionId: string) {
    await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
  },
};
