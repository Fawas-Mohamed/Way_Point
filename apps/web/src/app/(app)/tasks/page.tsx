"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AddTaskDependencySchema, CreateTaskCommentSchema, CreateTaskSchema, type AddTaskDependencyInput, type CreateTaskCommentInput, type CreateTaskInput } from "@waypoint/types";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProjects } from "@/features/projects/hooks";
import { tasksApi } from "@/features/tasks/api";
import { useTask, useTaskActions, useProjectTasks, useTaskBoard } from "@/features/tasks/hooks";
import type { TaskDetail, TaskListItem, TaskStatus } from "@/features/tasks/types";

const BOARD_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TasksPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list" | "calendar">("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ page: 1, pageSize: 100, sortBy: "createdAt", sortOrder: "desc" });

  useEffect(() => {
    if (!projectId && projectsData?.items.length) setProjectId(projectsData.items[0].id);
  }, [projectId, projectsData]);

  const projectQueries = useQueries({
    queries: (projectsData?.items ?? []).map((project) => ({
      queryKey: ["tasks", project.id, "assigned"],
      queryFn: () => tasksApi.list(project.id, { page: 1, pageSize: 100, sortBy: "position", sortOrder: "asc" }),
      enabled: Boolean(project.id),
    })),
  });

  const assignedTasks = useMemo(() => {
    return projectQueries.flatMap((query, index) => {
      const project = projectsData?.items[index];
      const items = query.data?.items ?? [];
      return items.filter((task) => task.assigneeId === user?.id).map((task) => ({ ...task, project }));
    });
  }, [projectQueries, projectsData?.items, user?.id]);

  const board = useTaskBoard(projectId);
  const list = useProjectTasks(projectId, { page: 1, pageSize: 100, sortBy: "position", sortOrder: "asc" });
  const selectedTask = useTask(selectedTaskId);
  const actions = useTaskActions();

  const createForm = useForm<CreateTaskInput>({ resolver: zodResolver(CreateTaskSchema), defaultValues: { title: "", description: "", priority: "MEDIUM", labelIds: [] } });
  const commentForm = useForm<CreateTaskCommentInput>({ resolver: zodResolver(CreateTaskCommentSchema), defaultValues: { body: "" } });
  const dependencyForm = useForm<AddTaskDependencyInput>({ resolver: zodResolver(AddTaskDependencySchema), defaultValues: { blockingTaskId: "" } });

  const boardColumns = useMemo(() => {
    const columns: Record<TaskStatus, TaskListItem[]> = { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
    for (const status of BOARD_STATUSES) {
      columns[status] = board.data?.[status] ?? [];
    }
    return columns;
  }, [board.data]);

  if (projectsLoading) return <TasksSkeleton />;
  if (projectsData && projectsData.items.length === 0) {
    return <EmptyState icon={Badge as never} title="No projects available" description="Create a project first so tasks have a board to live on." />;
  }
  if (projectId && (board.isError || list.isError)) {
    return <ErrorState message="We couldn't load your tasks." onRetry={() => { board.refetch(); list.refetch(); }} />;
  }

  async function handleCreate(values: CreateTaskInput) {
    if (!projectId) return;
    try {
      await actions.create.mutateAsync({ projectId, input: values });
      createForm.reset();
      setCreateOpen(false);
      await Promise.all([board.refetch(), list.refetch()]);
    } catch (err) {
      createForm.setError("root", { message: getApiErrorMessage(err, "Unable to create task") });
    }
  }

  async function handleComment(values: CreateTaskCommentInput) {
    if (!selectedTaskId) return;
    try {
      await actions.addComment.mutateAsync({ taskId: selectedTaskId, input: values });
      commentForm.reset();
      selectedTask.refetch();
    } catch (err) {
      commentForm.setError("root", { message: getApiErrorMessage(err, "Unable to add comment") });
    }
  }

  async function handleDependency(values: AddTaskDependencyInput) {
    if (!selectedTaskId) return;
    try {
      await actions.addDependency.mutateAsync({ taskId: selectedTaskId, input: values });
      dependencyForm.reset();
      selectedTask.refetch();
    } catch (err) {
      dependencyForm.setError("root", { message: getApiErrorMessage(err, "Unable to add dependency") });
    }
  }

  async function moveTask(task: TaskListItem, status: TaskStatus, position: number) {
    await actions.move.mutateAsync({ taskId: task.id, input: { status, position } });
    await Promise.all([board.refetch(), list.refetch()]);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Tasks" }]} />

      <PageHeader
        eyebrow="Tasks"
        title="My task workspace"
        description="Track your assigned work in a board, list, or calendar view across every project you can access."
        action={<Button onClick={() => setCreateOpen(true)}>Create task</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {projectsData?.items.map((project) => (
          <button key={project.id} onClick={() => setProjectId(project.id)} className={`rounded-full border px-3 py-1.5 text-caption ${projectId === project.id ? "border-indigo-deep bg-indigo-soft text-ink" : "border-hairline bg-paper text-slate-mid"}`}>
            {project.name}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(["board", "list", "calendar"] as const).map((item) => (
              <Button key={item} size="sm" variant={view === item ? "primary" : "secondary"} onClick={() => setView(item)}>
                {item[0].toUpperCase() + item.slice(1)} view
              </Button>
            ))}
          </div>
          <Badge>{assignedTasks.length} assigned tasks</Badge>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h2 text-ink">Assigned tasks</h2>
          <p className="text-caption text-slate-mid">Only tasks assigned to {user?.firstName} are shown here.</p>
        </div>
        {assignedTasks.length === 0 ? (
          <EmptyState icon={Badge as never} title="Nothing assigned yet" description="Assigned tasks will appear here once you are added to work items." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assignedTasks.map((task) => (
              <button key={task.id} onClick={() => setSelectedTaskId(task.id)} className="rounded-md border border-hairline bg-cloud p-4 text-left hover:border-slate-mid/40">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-h3 text-ink">{task.title}</h3>
                  <Badge>{task.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-body text-slate-mid">{task.project?.name}</p>
                <div className="mt-3 flex items-center justify-between text-caption text-slate-mid">
                  <span>{formatDate(task.dueDate)}</span>
                  <span>{task._count.comments} comments</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {view === "board" && (
        <div className="grid gap-4 xl:grid-cols-4">
          {BOARD_STATUSES.map((status) => (
            <div key={status} className="rounded-md border border-hairline bg-paper p-4" onDragOver={(e) => e.preventDefault()} onDrop={() => {
              const task = boardColumns[status][0];
              if (task) moveTask(task, status, boardColumns[status].length - 1);
            }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-h3 text-ink">{status.replaceAll("_", " ")}</h3>
                <Badge>{boardColumns[status].length}</Badge>
              </div>
              <div className="space-y-3">
                {boardColumns[status].map((task) => (
                  <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)} className="rounded-sm border border-hairline bg-cloud p-3" onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("text/task-id");
                    const dragged = boardColumns[status].find((candidate) => candidate.id === draggedId) ?? task;
                    moveTask(dragged, status, boardColumns[status].length);
                  }}>
                    <button onClick={() => setSelectedTaskId(task.id)} className="text-left">
                      <p className="font-medium text-ink">{task.title}</p>
                      <p className="mt-1 text-caption text-slate-mid">{formatDate(task.dueDate)}</p>
                    </button>
                  </div>
                ))}
                {boardColumns[status].length === 0 && <EmptyState icon={Badge as never} title="No tasks" description="Drop a task here to change its status." />}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.6fr] border-b border-hairline bg-cloud px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-mid">
            <span>Task</span><span>Status</span><span>Priority</span><span>Due</span><span>Assignee</span>
          </div>
          <div className="divide-y divide-hairline">
            {list.data?.items.map((task) => (
              <button key={task.id} onClick={() => setSelectedTaskId(task.id)} className="grid w-full grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.6fr] items-center px-4 py-3 text-left hover:bg-cloud/70">
                <span className="font-medium text-ink">{task.title}</span>
                <span className="text-caption text-slate-mid">{task.status.replaceAll("_", " ")}</span>
                <span className="text-caption text-slate-mid">{task.priority}</span>
                <span className="text-caption text-slate-mid">{formatDate(task.dueDate)}</span>
                <span className="text-caption text-slate-mid">{task.assignee?.firstName || "Unassigned"}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {view === "calendar" && <TaskCalendar tasks={list.data?.items ?? []} />}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create task" description="Add a work item to the selected project." className="max-w-2xl">
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4" noValidate>
          <Field label="Title" error={createForm.formState.errors.title?.message}><Input {...createForm.register("title")} error={createForm.formState.errors.title?.message} /></Field>
          <Field label="Description" error={createForm.formState.errors.description?.message}><Textarea {...createForm.register("description")} error={createForm.formState.errors.description?.message} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Priority"><Select {...createForm.register("priority")}><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="URGENT">URGENT</option></Select></Field>
            <Field label="Due date"><Input type="date" {...createForm.register("dueDate", { setValueAs: (value) => (value === "" ? undefined : value) })} /></Field>
            <Field label="Assignee ID"><Input {...createForm.register("assigneeId", { setValueAs: (value) => (value === "" ? undefined : value) })} /></Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createForm.formState.isSubmitting}>Create task</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(selectedTaskId)} onClose={() => setSelectedTaskId(null)} title={selectedTask.data?.title ?? "Task details"} description={selectedTask.data?.projectId ? `Project: ${selectedTask.data.projectId}` : undefined} className="max-w-4xl">
        {selectedTask.isLoading ? <Skeleton className="h-64" /> : selectedTask.data ? <TaskDrawer task={selectedTask.data} commentForm={commentForm} dependencyForm={dependencyForm} onComment={handleComment} onDependency={handleDependency} /> : <ErrorState message="We couldn't load this task." onRetry={() => selectedTask.refetch()} />}
      </Modal>
    </div>
  );
}

function TaskDrawer({ task, commentForm, dependencyForm, onComment, onDependency }: { task: TaskDetail; commentForm: ReturnType<typeof useForm<CreateTaskCommentInput>>; dependencyForm: ReturnType<typeof useForm<AddTaskDependencyInput>>; onComment: (values: CreateTaskCommentInput) => Promise<void>; onDependency: (values: AddTaskDependencyInput) => Promise<void>; }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-caption text-slate-mid">Status</p>
          <Badge className="mt-2">{task.status.replaceAll("_", " ")}</Badge>
          <p className="mt-4 text-caption text-slate-mid">Priority</p>
          <Badge className="mt-2">{task.priority}</Badge>
        </Card>
        <Card className="p-4">
          <p className="text-caption text-slate-mid">Assignee</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar firstName={task.assignee?.firstName || "Unassigned"} lastName={task.assignee?.lastName || ""} avatarUrl={task.assignee?.avatarUrl || null} size="sm" />
            <div>
              <p className="text-body text-ink">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned"}</p>
              <p className="text-caption text-slate-mid">{formatDate(task.dueDate)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-h3 text-ink">Subtasks</h3>
          <div className="mt-3 space-y-2">
            {task.subtasks.length ? task.subtasks.map((subtask) => <p key={subtask.id} className="rounded-sm border border-hairline bg-cloud px-3 py-2 text-body text-ink">{subtask.title}</p>) : <EmptyState icon={Badge as never} title="No subtasks" description="Break the task into smaller pieces when needed." />}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-h3 text-ink">Dependencies</h3>
          <div className="mt-3 space-y-2">
            {task.dependsOn.length ? task.dependsOn.map((dependency) => <p key={dependency.id} className="rounded-sm border border-hairline bg-cloud px-3 py-2 text-body text-ink">Blocked by {dependency.blockingTask.title}</p>) : <EmptyState icon={Badge as never} title="No dependencies" description="Add a blocking task below to prevent premature completion." />}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-h3 text-ink">Comments</h3>
        <form onSubmit={commentForm.handleSubmit(onComment)} className="mt-3 space-y-3" noValidate>
          <Textarea {...commentForm.register("body")} error={commentForm.formState.errors.body?.message} rows={4} placeholder="Write a comment..." />
          <FieldError message={commentForm.formState.errors.root?.message} />
          <Button type="submit" isLoading={commentForm.formState.isSubmitting}>Add comment</Button>
        </form>
        <div className="mt-4 space-y-3">
          {task.comments.map((comment) => (
            <div key={comment.id} className="rounded-sm border border-hairline bg-cloud px-3 py-2">
              <p className="text-body text-ink">{comment.body}</p>
              <p className="mt-1 text-caption text-slate-mid">{comment.author.firstName} · {new Date(comment.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-h3 text-ink">Add dependency</h3>
        <form onSubmit={dependencyForm.handleSubmit(onDependency)} className="mt-3 space-y-3" noValidate>
          <Field label="Blocking task ID" error={dependencyForm.formState.errors.blockingTaskId?.message}><Input {...dependencyForm.register("blockingTaskId")} error={dependencyForm.formState.errors.blockingTaskId?.message} /></Field>
          <Button type="submit" isLoading={dependencyForm.formState.isSubmitting}>Add dependency</Button>
        </form>
      </Card>
    </div>
  );
}

function TaskCalendar({ tasks }: { tasks: TaskListItem[] }) {
  const days = Array.from({ length: 35 }, (_, index) => index + 1);
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-h2 text-ink">Calendar</h2>
      <div className="grid grid-cols-7 gap-2 text-center text-caption text-slate-mid">
        {days.map((day) => <div key={day} className="rounded-sm border border-hairline bg-cloud p-2">{day <= 30 ? day : ""}</div>)}
      </div>
      <div className="mt-6 space-y-2">
        {tasks.filter((task) => task.dueDate).slice(0, 8).map((task) => (
          <div key={task.id} className="flex items-center justify-between rounded-sm border border-hairline bg-cloud px-4 py-3">
            <span className="font-medium text-ink">{task.title}</span>
            <span className="text-caption text-slate-mid">Due {formatDate(task.dueDate)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <div><Label>{label}</Label>{children}<FieldError message={error} /></div>;
}

function TasksSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-16" />
      <Skeleton className="h-12" />
      <div className="grid gap-4 xl:grid-cols-4">
        <Skeleton className="h-[500px]" />
        <Skeleton className="h-[500px]" />
        <Skeleton className="h-[500px]" />
        <Skeleton className="h-[500px]" />
      </div>
    </div>
  );
}