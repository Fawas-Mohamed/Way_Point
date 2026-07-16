import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "./api";
import type { ListTasksQuery } from "@waypoint/types";

export function useProjectTasks(projectId: string | null, params: ListTasksQuery) {
  return useQuery({ queryKey: ["tasks", projectId, params], queryFn: () => tasksApi.list(projectId!, params), enabled: Boolean(projectId) });
}

export function useTaskBoard(projectId: string | null) {
  return useQuery({ queryKey: ["tasks", projectId, "board"], queryFn: () => tasksApi.board(projectId!), enabled: Boolean(projectId) });
}

export function useTask(taskId: string | null) {
  return useQuery({ queryKey: ["tasks", taskId], queryFn: () => tasksApi.getById(taskId!), enabled: Boolean(taskId) });
}

export function useTaskActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  return {
    create: useMutation({ mutationFn: ({ projectId, input }: { projectId: string; input: Parameters<typeof tasksApi.create>[1] }) => tasksApi.create(projectId, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ taskId, input }: { taskId: string; input: Parameters<typeof tasksApi.update>[1] }) => tasksApi.update(taskId, input), onSuccess: invalidate }),
    move: useMutation({ mutationFn: ({ taskId, input }: { taskId: string; input: Parameters<typeof tasksApi.move>[1] }) => tasksApi.move(taskId, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: tasksApi.remove, onSuccess: invalidate }),
    addComment: useMutation({ mutationFn: ({ taskId, input }: { taskId: string; input: Parameters<typeof tasksApi.addComment>[1] }) => tasksApi.addComment(taskId, input), onSuccess: invalidate }),
    updateComment: useMutation({ mutationFn: ({ taskId, commentId, body }: { taskId: string; commentId: string; body: string }) => tasksApi.updateComment(taskId, commentId, body), onSuccess: invalidate }),
    deleteComment: useMutation({ mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) => tasksApi.deleteComment(taskId, commentId), onSuccess: invalidate }),
    addDependency: useMutation({ mutationFn: ({ taskId, input }: { taskId: string; input: Parameters<typeof tasksApi.addDependency>[1] }) => tasksApi.addDependency(taskId, input), onSuccess: invalidate }),
    removeDependency: useMutation({ mutationFn: ({ taskId, blockingTaskId }: { taskId: string; blockingTaskId: string }) => tasksApi.removeDependency(taskId, blockingTaskId), onSuccess: invalidate }),
  };
}