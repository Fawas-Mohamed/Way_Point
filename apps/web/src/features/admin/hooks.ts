import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./api";
import type { ListUsersQuery } from "@waypoint/types";

export function useAdminUsers(params: ListUsersQuery) {
  return useQuery({ queryKey: ["admin", "users", params], queryFn: () => adminApi.users(params) });
}

export function useAdminRoles() {
  return useQuery({ queryKey: ["admin", "roles"], queryFn: adminApi.roles });
}

export function useAdminPermissions() {
  return useQuery({ queryKey: ["admin", "permissions"], queryFn: adminApi.permissions });
}

export function useAdminActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin"] });
  return {
    createUser: useMutation({ mutationFn: adminApi.createUser, onSuccess: invalidate }),
    updateUser: useMutation({ mutationFn: ({ userId, input }: { userId: string; input: Parameters<typeof adminApi.updateUser>[1] }) => adminApi.updateUser(userId, input), onSuccess: invalidate }),
    deactivateUser: useMutation({ mutationFn: adminApi.deactivateUser, onSuccess: invalidate }),
    grantPermission: useMutation({ mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) => adminApi.grantPermission(roleId, permissionId), onSuccess: invalidate }),
    revokePermission: useMutation({ mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) => adminApi.revokePermission(roleId, permissionId), onSuccess: invalidate }),
  };
}
