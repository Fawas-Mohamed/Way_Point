import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "./api";
import type { ListProjectsQuery } from "@waypoint/types";

export function useProjects(params: ListProjectsQuery) {
  return useQuery({ queryKey: ["projects", params], queryFn: () => projectsApi.list(params) });
}

export function useProject(projectId: string | null) {
  return useQuery({ queryKey: ["projects", projectId], queryFn: () => projectsApi.getById(projectId!), enabled: Boolean(projectId) });
}

export function useProjectFiles(projectId: string | null) {
  return useQuery({ queryKey: ["projects", projectId, "files"], queryFn: () => projectsApi.listFiles(projectId!), enabled: Boolean(projectId) });
}

export function useProjectActivity(projectId: string | null) {
  return useQuery({ queryKey: ["projects", projectId, "activity"], queryFn: () => projectsApi.listActivity(projectId!), enabled: Boolean(projectId) });
}

export function useProjectActions() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });

  return {
    create: useMutation({ mutationFn: projectsApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ projectId, input }: { projectId: string; input: Parameters<typeof projectsApi.update>[1] }) => projectsApi.update(projectId, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: projectsApi.archive, onSuccess: invalidate }),
    restore: useMutation({ mutationFn: projectsApi.restore, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: projectsApi.remove, onSuccess: invalidate }),
    addMember: useMutation({ mutationFn: ({ projectId, input }: { projectId: string; input: Parameters<typeof projectsApi.addMember>[1] }) => projectsApi.addMember(projectId, input), onSuccess: invalidate }),
    updateMember: useMutation({ mutationFn: ({ projectId, userId, input }: { projectId: string; userId: string; input: Parameters<typeof projectsApi.updateMemberRole>[2] }) => projectsApi.updateMemberRole(projectId, userId, input), onSuccess: invalidate }),
    removeMember: useMutation({ mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) => projectsApi.removeMember(projectId, userId), onSuccess: invalidate }),
  };
}