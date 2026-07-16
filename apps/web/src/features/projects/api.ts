import { apiClient } from "@/lib/api-client";
import type { ProjectActivityEntry, ProjectDetail, ProjectFile, ProjectListItem } from "./types";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput, AddProjectMemberInput, UpdateProjectMemberInput } from "@waypoint/types";

type ListResponse<T> = { items: T[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number } };

export const projectsApi = {
  async list(params: ListProjectsQuery) {
    const res = await apiClient.get<{ data: ListResponse<ProjectListItem> }>("/projects", { params });
    return res.data.data;
  },
  async getById(projectId: string) {
    const res = await apiClient.get<{ data: { project: ProjectDetail } }>(`/projects/${projectId}`);
    return res.data.data.project;
  },
  async create(input: CreateProjectInput) {
    const res = await apiClient.post<{ data: { project: ProjectDetail } }>("/projects", input);
    return res.data.data.project;
  },
  async update(projectId: string, input: UpdateProjectInput) {
    const res = await apiClient.patch<{ data: { project: ProjectDetail } }>(`/projects/${projectId}`, input);
    return res.data.data.project;
  },
  async archive(projectId: string) {
    const res = await apiClient.post<{ data: { project: ProjectDetail } }>(`/projects/${projectId}/archive`);
    return res.data.data.project;
  },
  async restore(projectId: string) {
    const res = await apiClient.post<{ data: { project: ProjectDetail } }>(`/projects/${projectId}/restore`);
    return res.data.data.project;
  },
  async remove(projectId: string) {
    await apiClient.delete(`/projects/${projectId}`);
  },
  async addMember(projectId: string, input: AddProjectMemberInput) {
    const res = await apiClient.post<{ data: { member: ProjectDetail["members"][number] } }>(`/projects/${projectId}/members`, input);
    return res.data.data.member;
  },
  async updateMemberRole(projectId: string, userId: string, input: UpdateProjectMemberInput) {
    const res = await apiClient.patch<{ data: { member: ProjectDetail["members"][number] } }>(`/projects/${projectId}/members/${userId}`, input);
    return res.data.data.member;
  },
  async removeMember(projectId: string, userId: string) {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
  async listFiles(projectId: string) {
    const res = await apiClient.get<{ data: { files: ProjectFile[] } }>(`/projects/${projectId}/files`);
    return res.data.data.files;
  },
  async listActivity(projectId: string) {
    const res = await apiClient.get<{ data: { activity: ProjectActivityEntry[] } }>(`/projects/${projectId}/activity`);
    return res.data.data.activity;
  },
};