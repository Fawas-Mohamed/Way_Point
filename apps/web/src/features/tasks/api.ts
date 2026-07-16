import { apiClient } from "@/lib/api-client";
import type { TaskDetail, TaskListItem } from "./types";
import type { AddTaskDependencyInput, CreateTaskCommentInput, CreateTaskInput, ListTasksQuery, MoveTaskInput, UpdateTaskInput } from "@waypoint/types";

type ListResponse<T> = { items: T[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export const tasksApi = {
  async list(projectId: string, params: ListTasksQuery) {
    const res = await apiClient.get<{ data: ListResponse<TaskListItem> }>(`/projects/${projectId}/tasks`, { params });
    return res.data.data;
  },
  async board(projectId: string) {
    const res = await apiClient.get<{ data: { board: Record<string, TaskListItem[]> } }>(`/projects/${projectId}/tasks/board`);
    return res.data.data.board;
  },
  async getById(taskId: string) {
    const res = await apiClient.get<{ data: { task: TaskDetail } }>(`/tasks/${taskId}`);
    return res.data.data.task;
  },
  async create(projectId: string, input: CreateTaskInput) {
    const res = await apiClient.post<{ data: { task: TaskDetail } }>(`/projects/${projectId}/tasks`, input);
    return res.data.data.task;
  },
  async update(taskId: string, input: UpdateTaskInput) {
    const res = await apiClient.patch<{ data: { task: TaskDetail } }>(`/tasks/${taskId}`, input);
    return res.data.data.task;
  },
  async move(taskId: string, input: MoveTaskInput) {
    const res = await apiClient.post<{ data: { task: TaskDetail } }>(`/tasks/${taskId}/move`, input);
    return res.data.data.task;
  },
  async remove(taskId: string) {
    await apiClient.delete(`/tasks/${taskId}`);
  },
  async addComment(taskId: string, input: CreateTaskCommentInput) {
    const res = await apiClient.post<{ data: { comment: TaskDetail["comments"][number] } }>(`/tasks/${taskId}/comments`, input);
    return res.data.data.comment;
  },
  async updateComment(taskId: string, commentId: string, body: string) {
    const res = await apiClient.patch<{ data: { comment: TaskDetail["comments"][number] } }>(`/tasks/${taskId}/comments/${commentId}`, { body });
    return res.data.data.comment;
  },
  async deleteComment(taskId: string, commentId: string) {
    await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
  async addDependency(taskId: string, input: AddTaskDependencyInput) {
    await apiClient.post(`/tasks/${taskId}/dependencies`, input);
  },
  async removeDependency(taskId: string, blockingTaskId: string) {
    await apiClient.delete(`/tasks/${taskId}/dependencies/${blockingTaskId}`);
  },
};