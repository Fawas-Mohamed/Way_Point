"use client";

import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, FolderKanban, Users, Paperclip, Clock3, Archive, Trash2, PencilLine, Eye, Activity, CalendarDays, Tag, DollarSign, ArrowUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProjectSchema, UpdateProjectSchema, type CreateProjectInput, type UpdateProjectInput } from "@waypoint/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FieldError } from "@/components/ui/FieldError";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getApiErrorMessage } from "@/lib/api-client";
import { useProjects, useProject, useProjectFiles, useProjectActivity, useProjectActions } from "@/features/projects/hooks";
import type { ProjectDetail } from "@/features/projects/types";

const statusOptions = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const;
const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const sortOptions = ["createdAt", "dueDate", "name", "priority", "status"] as const;

function formatCurrency(value: string | null) {
  if (!value) return "No budget set";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function projectProgress(project: ProjectDetail) {
  const doneMilestones = project.milestones.filter((m) => Boolean(m.completedAt)).length;
  const milestoneProgress = project.milestones.length ? Math.round((doneMilestones / project.milestones.length) * 100) : 0;
  const taskProgress = project._count.tasks ? Math.min(100, Math.round((doneMilestones / Math.max(1, project._count.tasks)) * 100)) : 0;
  return Math.max(milestoneProgress, taskProgress);
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useProjects({ page: 1, pageSize: 100, search: search || undefined, status: (status || undefined) as never, priority: (priority || undefined) as never, sortBy, sortOrder });
  const selectedProject = useProject(selectedProjectId);
  const files = useProjectFiles(selectedProjectId);
  const activity = useProjectActivity(selectedProjectId);
  const actions = useProjectActions();

  const activeProjectSummary = selectedProjectId ? data?.items.find((project) => project.id === selectedProjectId) ?? null : data?.items[0] ?? null;
  const activeProject = selectedProject.data ?? null;

  useState(() => {
    if (!selectedProjectId && data?.items.length) setSelectedProjectId(data.items[0].id);
  });

  const list = data?.items ?? [];

  const createForm = useForm<CreateProjectInput>({ resolver: zodResolver(CreateProjectSchema), defaultValues: { name: "", description: "", priority: "MEDIUM", budget: undefined } });
  const editForm = useForm<UpdateProjectInput>({ resolver: zodResolver(UpdateProjectSchema), defaultValues: { name: activeProject?.name ?? activeProjectSummary?.name ?? "", description: activeProject?.description ?? activeProjectSummary?.description ?? "", status: activeProject?.status ?? activeProjectSummary?.status, priority: activeProject?.priority ?? activeProjectSummary?.priority, budget: activeProject?.budget ? Number(activeProject.budget) : undefined } });

  const selectedProgress = useMemo(() => (activeProject ? projectProgress(activeProject) : 0), [activeProject]);

  async function handleCreate(values: CreateProjectInput) {
    try {
      const created = await actions.create.mutateAsync(values);
      setCreateOpen(false);
      setSelectedProjectId(created.id);
      createForm.reset();
    } catch (err) {
      createForm.setError("root", { message: getApiErrorMessage(err, "Unable to create project") });
    }
  }

  async function handleUpdate(values: UpdateProjectInput) {
    if (!activeProject) return;
    try {
      await actions.update.mutateAsync({ projectId: activeProject.id, input: values });
      setEditOpen(false);
    } catch (err) {
      editForm.setError("root", { message: getApiErrorMessage(err, "Unable to update project") });
    }
  }

  if (isLoading) {
    return <ProjectPageSkeleton />;
  }

  if (isError) {
    return <ErrorState message="We couldn't load your projects." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Projects" }]} />

      <PageHeader
        eyebrow="Projects"
        title="Project portfolio"
        description="Track scope, budget, members, and delivery risk across every active project."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New project</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px_160px]">
            <div className="relative md:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-mid" />
              <Input className="pl-9" placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {statusOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </Select>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All priorities</option>
              {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              {sortOptions.map((option) => <option key={option} value={option}>Sort: {option}</option>)}
            </Select>
            <Button variant="secondary" onClick={() => setSortOrder((value) => (value === "asc" ? "desc" : "asc"))}>
              <ArrowUpDown className="h-4 w-4" /> {sortOrder === "asc" ? "Oldest" : "Newest"}
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {list.length === 0 ? (
              <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start tracking scope, delivery, and team membership." action={<Button onClick={() => setCreateOpen(true)}>Create project</Button>} />
            ) : (
              list.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full rounded-md border px-4 py-4 text-left transition-colors ${selectedProjectId === project.id ? "border-indigo-deep bg-indigo-soft/30" : "border-hairline bg-paper hover:border-slate-mid/40"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-h3 text-ink">{project.name}</h3>
                        <Badge>{project.status.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="mt-1 max-w-2xl text-body text-slate-mid">{project.description || "No project description yet."}</p>
                    </div>
                    <div className="text-right text-caption text-slate-mid">
                      <p>{formatCurrency(project.budget)}</p>
                      <p>{project._count.tasks} tasks</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-caption text-slate-mid">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {project._count.members} members</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Due {formatDate(project.dueDate)}</span>
                    <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {project.priority}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {activeProject ? (
            <>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-indigo-deep">Selected project</p>
                    <h2 className="mt-1 font-display text-h2 text-ink">{activeProject?.name ?? activeProjectSummary?.name}</h2>
                    <p className="mt-1 text-body text-slate-mid">{activeProject?.description || activeProjectSummary?.description || "No project description yet."}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><PencilLine className="h-4 w-4" /> Edit</Button>
                    <Button variant="secondary" size="sm" onClick={() => actions.archive.mutate(activeProject.id)}><Archive className="h-4 w-4" /> Archive</Button>
                    <Button variant="secondary" size="sm" onClick={() => actions.remove.mutate(activeProject.id)}><Trash2 className="h-4 w-4" /> Delete</Button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Metric label="Status" value={(activeProject?.status ?? activeProjectSummary?.status ?? "").replaceAll("_", " ")} icon={FolderKanban} />
                  <Metric label="Priority" value={activeProject?.priority ?? activeProjectSummary?.priority ?? ""} icon={SlidersHorizontal} />
                  <Metric label="Progress" value={`${selectedProgress}%`} icon={Eye} />
                  <Metric label="Budget" value={formatCurrency(activeProject?.budget ?? activeProjectSummary?.budget ?? null)} icon={DollarSign} />
                  <Metric label="Timeline" value={`${formatDate(activeProject?.startDate ?? activeProjectSummary?.startDate ?? null)} → ${formatDate(activeProject?.dueDate ?? activeProjectSummary?.dueDate ?? null)}`} icon={Clock3} />
                  <Metric label="Members" value={String(activeProject?.members.length ?? activeProjectSummary?._count.members ?? 0)} icon={Users} />
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={Users} title="Members" />
                <div className="mt-4 space-y-3">
                  {activeProject?.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-sm border border-hairline bg-cloud px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={member.user.firstName} lastName={member.user.lastName} avatarUrl={member.user.avatarUrl} size="sm" />
                        <div>
                          <p className="text-body font-medium text-ink">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-caption text-slate-mid">{member.user.jobTitle || "Team member"}</p>
                        </div>
                      </div>
                      <Badge>{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={CalendarDays} title="Timeline" />
                <div className="mt-4 space-y-3">
                  {(activeProject?.milestones?.length ?? 0) === 0 ? (
                    <EmptyState icon={CalendarDays} title="No milestones yet" description="Milestones will appear here once they are added to the project." />
                  ) : (
                    activeProject?.milestones?.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between rounded-sm border border-hairline bg-cloud px-4 py-3">
                        <div>
                          <p className="text-body font-medium text-ink">{milestone.title}</p>
                          <p className="text-caption text-slate-mid">{milestone.description || "Milestone without description"}</p>
                        </div>
                        <Badge>{milestone.completedAt ? "Complete" : formatDate(milestone.dueDate)}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={Paperclip} title="Files" />
                <div className="mt-4 space-y-3">
                  {files.data?.length ? files.data.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-sm border border-hairline bg-cloud px-4 py-3">
                      <div>
                        <p className="text-body font-medium text-ink">{file.fileName}</p>
                        <p className="text-caption text-slate-mid">{file.mimeType} · {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <p className="text-caption text-slate-mid">Uploaded by {file.uploader.firstName}</p>
                    </div>
                  )) : <EmptyState icon={Paperclip} title="No project files" description="Attached files will appear here when they are uploaded." />}
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={Activity} title="Activity" />
                <div className="mt-4 space-y-3">
                  {activity.data?.length ? activity.data.map((entry) => (
                    <div key={entry.id} className="rounded-sm border border-hairline bg-cloud px-4 py-3">
                      <p className="text-body font-medium text-ink">{entry.action}</p>
                      <p className="text-caption text-slate-mid">{entry.actor.firstName} · {new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  )) : <EmptyState icon={Activity} title="No activity yet" description="Project updates and status changes will appear here." />}
                </div>
              </Card>
            </>
          ) : (
            <EmptyState icon={FolderKanban} title="Select a project" description="Choose any project from the list to inspect its details and timeline." />
          )}
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create project" description="Start a new project with status, priority, and budget." className="max-w-2xl">
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4" noValidate>
          <FieldSet label="Name" error={createForm.formState.errors.name?.message}><Input {...createForm.register("name")} error={createForm.formState.errors.name?.message} /></FieldSet>
          <FieldSet label="Description" error={createForm.formState.errors.description?.message}><Input {...createForm.register("description")} error={createForm.formState.errors.description?.message} /></FieldSet>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldSet label="Priority"><Select {...createForm.register("priority")}><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></Select></FieldSet>
            <FieldSet label="Budget"><Input type="number" step="1" {...createForm.register("budget", { setValueAs: (value) => (value === "" ? undefined : Number(value)) })} /></FieldSet>
            <FieldSet label="Team ID"><Input {...createForm.register("teamId", { setValueAs: (value) => (value === "" ? undefined : value) })} /></FieldSet>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createForm.formState.isSubmitting}>Create project</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit project" description="Update the selected project." className="max-w-2xl">
        <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4" noValidate>
          <FieldSet label="Name" error={editForm.formState.errors.name?.message}><Input {...editForm.register("name")} error={editForm.formState.errors.name?.message} /></FieldSet>
          <FieldSet label="Description" error={editForm.formState.errors.description?.message}><Input {...editForm.register("description")} error={editForm.formState.errors.description?.message} /></FieldSet>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldSet label="Status"><Select {...editForm.register("status")}><option value="PLANNING">PLANNING</option><option value="ACTIVE">ACTIVE</option><option value="ON_HOLD">ON_HOLD</option><option value="COMPLETED">COMPLETED</option><option value="ARCHIVED">ARCHIVED</option></Select></FieldSet>
            <FieldSet label="Priority"><Select {...editForm.register("priority")}><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></Select></FieldSet>
            <FieldSet label="Budget"><Input type="number" step="1" {...editForm.register("budget", { setValueAs: (value) => (value === "" ? undefined : Number(value)) })} /></FieldSet>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={editForm.formState.isSubmitting}>Save changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof FolderKanban }) {
  return (
    <div className="rounded-sm border border-hairline bg-cloud px-4 py-3">
      <div className="flex items-center gap-2 text-caption text-slate-mid"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="mt-1 text-body font-medium text-ink">{value}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof FolderKanban; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-indigo-deep" />
      <h3 className="text-h3 text-ink">{title}</h3>
    </div>
  );
}

function FieldSet({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function ProjectPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-[700px]" />
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    </div>
  );
}