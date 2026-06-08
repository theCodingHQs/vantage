import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { 
  getProjects, 
  getProjectDetail, 
  createProject, 
  updateProjectStatus, 
  createTask, 
  updateTaskStatus,
  getTimeEntries
} from '#/server/functions/projects'
import { getClients } from '#/server/functions/crm'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Modal } from '#/components/ui/modal'
import { ProjectForm } from '#/components/forms/project-form'
import { formatCurrency, formatDate, durationToHours } from '#/lib/utils'
import { 
  Plus, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  Calendar, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

export const Route = createFileRoute('/_app/projects')({
  loader: async () => {
    const projectsList = await getProjects({ data: { status: 'all' } })
    const clientsList = await getClients({ data: { status: 'all' } })
    const timeEntriesList = await getTimeEntries()
    return { projectsList, clientsList, timeEntriesList }
  },
  component: ProjectsPage,
})

function ProjectsPage() {
  const { projectsList, clientsList, timeEntriesList } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectDetail, setProjectDetail] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'time'>('overview')

  // Task creation Form State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskEstHours, setTaskEstHours] = useState('2')

  // Drag and Drop Task State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null)
  const [processingTaskStatus, setProcessingTaskStatus] = useState<'todo' | 'in_progress' | 'review' | 'done' | null>(null)

  const handleCreateProjectSuccess = () => {
    setIsAddProjectOpen(false)
    router.invalidate()
  }

  // Load project details
  const handleOpenProject = async (id: string) => {
    setSelectedProjectId(id)
    setLoadingDetail(true)
    setActiveTab('overview')
    try {
      const detail = await getProjectDetail({ data: { id } })
      setProjectDetail(detail)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Create task handler
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle || !selectedProjectId) return

    try {
      await createTask({
        data: {
          projectId: selectedProjectId,
          title: taskTitle,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          estimatedHours: parseFloat(taskEstHours) || 0,
          description: '',
          assigneeNotes: ''
        }
      })
      setIsAddTaskOpen(false)
      setTaskTitle('')
      setTaskDueDate('')
      
      // Refresh details
      const detail = await getProjectDetail({ data: { id: selectedProjectId } })
      setProjectDetail(detail)
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  // Drag and drop task status update
  const handleTaskDragStart = (e: React.DragEvent, id: string) => {
    setDraggingTaskId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleTaskDrop = async (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'review' | 'done') => {
    e.preventDefault()
    if (!draggingTaskId || !selectedProjectId) return

    const taskId = draggingTaskId
    setProcessingTaskId(taskId)
    setProcessingTaskStatus(targetStatus)
    setDraggingTaskId(null)

    try {
      await updateTaskStatus({
        data: {
          id: taskId,
          status: targetStatus
        }
      })

      // Refresh details
      const detail = await getProjectDetail({ data: { id: selectedProjectId } })
      setProjectDetail(detail)
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingTaskId(null)
      setProcessingTaskStatus(null)
    }
  }

  const handleUpdateStatus = async (status: any) => {
    if (!selectedProjectId) return
    try {
      await updateProjectStatus({ data: { id: selectedProjectId, status } })
      const detail = await getProjectDetail({ data: { id: selectedProjectId } })
      setProjectDetail(detail)
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  // Task Kanban columns
  const taskColumns: { id: 'todo' | 'in_progress' | 'review' | 'done'; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'In Review' },
    { id: 'done', title: 'Completed' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Projects & Tasks</h1>
          <p className="text-xs text-text-2">Track client milestones, task boards, and time estimates.</p>
        </div>
        <Button size="sm" onClick={() => setIsAddProjectOpen(true)} className="flex items-center gap-1">
          <Plus size={14} /> New Project
        </Button>
      </div>

      {/* Projects Grid Card View */}
      {projectsList.length === 0 ? (
        <div className="text-center py-20 bg-surface-2/10 border border-dashed border-border rounded-xl">
          <Briefcase className="h-10 w-10 text-text-3 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-text-2">No active projects found</h3>
          <p className="text-xs text-text-3 mt-1.5 mb-6">Create a project to start logging hours and billing clients.</p>
          <Button size="sm" onClick={() => setIsAddProjectOpen(true)}>
            Start Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projectsList.map(({ project, clientName }) => {
            const timeEntriesForProject = timeEntriesList.filter(t => t.entry.projectId === project.id)
            let loggedMinutes = 0
            timeEntriesForProject.forEach(t => loggedMinutes += t.entry.durationMinutes)
            const hoursLogged = Math.round((loggedMinutes / 60) * 10) / 10

            return (
              <Card
                key={project.id}
                onClick={() => handleOpenProject(project.id)}
                className="hover:translate-y-[-2px] hover:border-accent/30 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] text-text-3 font-semibold uppercase">{clientName}</span>
                    <Badge variant={project.status === 'active' ? 'success' : 'primary'}>
                      {project.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-text-1 truncate">{project.title}</h3>
                  <p className="text-xs text-text-2 mt-1.5 line-clamp-2 min-h-[32px]">{project.description || 'No description provided'}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-text-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-text-3" />
                    <span>{hoursLogged} hours logged</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-success">
                      {project.type === 'hourly' ? `${formatCurrency(project.hourlyRate)}/hr` : formatCurrency(project.budget)}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      <Modal isOpen={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} title="New Project Contract" type="right">
        {clientsList.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-text-2">Add a client in CRM before creating a project.</p>
          </div>
        ) : (
          <ProjectForm clientsList={clientsList} onSuccess={handleCreateProjectSuccess} onCancel={() => setIsAddProjectOpen(false)} />
        )}
      </Modal>

      {/* PROJECT DETAILS SIDE DRAWER */}
      <Modal
        isOpen={selectedProjectId !== null}
        onClose={() => {
          setSelectedProjectId(null)
          setProjectDetail(null)
        }}
        title={projectDetail?.title || 'Loading details...'}
        type="right"
      >
        {loadingDetail && (
          <div className="py-20 text-center text-text-3 text-xs">Loading project details...</div>
        )}

        {projectDetail && (
          <div className="space-y-6">
            {/* Quick Header */}
            <div className="flex items-center justify-between p-4 border border-border bg-surface-2/40 rounded-xl">
              <div>
                <span className="text-[10px] text-text-3 font-semibold uppercase">{projectDetail.client.name}</span>
                <h4 className="text-sm font-bold text-text-1 mt-0.5">{projectDetail.title}</h4>
              </div>
              <Select
                options={[
                  { value: 'planning', label: 'Planning' },
                  { value: 'active', label: 'Active' },
                  { value: 'on_hold', label: 'On Hold' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                value={projectDetail.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="w-32 py-1 text-xs"
              />
            </div>

            {/* Budget / Spent Progress */}
            <div className="space-y-2 p-4 border border-border bg-surface-2/10 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-2 font-medium">Budget Utilization</span>
                <span className="text-text-1 font-bold">
                  {formatCurrency(projectDetail.metrics.timeValue)} / {formatCurrency(projectDetail.budget)} ({projectDetail.metrics.budgetUsedPercent}%)
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${projectDetail.metrics.budgetUsedPercent}%` }}
                />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/80 gap-4">
              {['overview', 'tasks', 'time'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-2 text-xs font-semibold capitalize border-b-2 transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'border-accent text-text-1 font-bold'
                      : 'border-transparent text-text-2 hover:text-text-1'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-sm animate-in fade-in duration-200">
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-text-3 uppercase">Scope / Deliverables</h5>
                  <p className="text-text-2 text-xs leading-relaxed italic">
                    {projectDetail.description || 'No description provided.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                  <div>
                    <h5 className="text-xs font-bold text-text-3 uppercase">Start Date</h5>
                    <p className="text-xs font-medium text-text-1 mt-1">
                      {projectDetail.startDate ? formatDate(projectDetail.startDate) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-text-3 uppercase">Deadline</h5>
                    <p className="text-xs font-medium text-text-1 mt-1">
                      {projectDetail.dueDate ? formatDate(projectDetail.dueDate) : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Tasks Kanban Board */}
            {activeTab === 'tasks' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-text-3 uppercase">Project Checklist</h5>
                  <Button size="sm" variant="secondary" onClick={() => setIsAddTaskOpen(true)} className="flex items-center gap-1 py-1 text-xs">
                    <Plus size={12} /> Add Task
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 h-[450px] overflow-y-auto">
                  {taskColumns.slice(0, 2).map(col => {
                    const colTasks = projectDetail.tasks.map((t: any) => {
                      if (t.id === processingTaskId && processingTaskStatus) {
                        return { ...t, status: processingTaskStatus }
                      }
                      return t
                    }).filter((t: any) => t.status === col.id)
                    return (
                      <div
                        key={col.id}
                        onDragOver={handleTaskDragOver}
                        onDrop={(e) => handleTaskDrop(e, col.id)}
                        className="bg-surface-2/30 border border-border/50 rounded-xl p-3 flex flex-col min-h-[300px]"
                      >
                        <h6 className="text-[10px] font-bold text-text-2 uppercase mb-3 border-b border-border/60 pb-1.5">{col.title}</h6>
                        <div className="space-y-2 flex-1">
                          {colTasks.length === 0 ? (
                            <div className="py-8 text-center text-text-3 text-[9px] border border-dashed border-border/40 rounded-lg">Drop here</div>
                          ) : (
                            colTasks.map((t: any) => {
                              const isProcessing = t.id === processingTaskId
                              return (
                                <div
                                  key={t.id}
                                  draggable={!isProcessing}
                                  onDragStart={(e) => handleTaskDragStart(e, t.id)}
                                  className={`p-2.5 bg-surface border rounded-lg text-xs space-y-1.5 transition-all relative overflow-hidden ${
                                    isProcessing
                                      ? 'border-accent/40 opacity-70 cursor-not-allowed select-none'
                                      : 'border-border hover:border-accent/30 cursor-grab active:cursor-grabbing'
                                  }`}
                                >
                                  {isProcessing && (
                                    <div className="absolute inset-0 bg-surface/60 backdrop-blur-[0.5px] flex items-center justify-center gap-1.5 text-[9px] text-accent font-semibold animate-pulse">
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-accent border-t-transparent flex-shrink-0" />
                                      <span>Updating...</span>
                                    </div>
                                  )}
                                  <p className="font-semibold text-text-1">{t.title}</p>
                                  <div className="flex justify-between items-center text-[9px]">
                                    <Badge variant={t.priority === 'high' || t.priority === 'urgent' ? 'danger' : 'secondary'}>
                                      {t.priority}
                                    </Badge>
                                    <span className="text-text-3">Est: {t.estimatedHours}h</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {taskColumns.slice(2, 4).map(col => {
                    const colTasks = projectDetail.tasks.map((t: any) => {
                      if (t.id === processingTaskId && processingTaskStatus) {
                        return { ...t, status: processingTaskStatus }
                      }
                      return t
                    }).filter((t: any) => t.status === col.id)
                    return (
                      <div
                        key={col.id}
                        onDragOver={handleTaskDragOver}
                        onDrop={(e) => handleTaskDrop(e, col.id)}
                        className="bg-surface-2/30 border border-border/50 rounded-xl p-3 flex flex-col min-h-[300px]"
                      >
                        <h6 className="text-[10px] font-bold text-text-2 uppercase mb-3 border-b border-border/60 pb-1.5">{col.title}</h6>
                        <div className="space-y-2 flex-1">
                          {colTasks.length === 0 ? (
                            <div className="py-8 text-center text-text-3 text-[9px] border border-dashed border-border/40 rounded-lg">Drop here</div>
                          ) : (
                            colTasks.map((t: any) => {
                              const isProcessing = t.id === processingTaskId
                              return (
                                <div
                                  key={t.id}
                                  draggable={!isProcessing}
                                  onDragStart={(e) => handleTaskDragStart(e, t.id)}
                                  className={`p-2.5 bg-surface border rounded-lg text-xs space-y-1.5 transition-all relative overflow-hidden ${
                                    isProcessing
                                      ? 'border-accent/40 opacity-70 cursor-not-allowed select-none'
                                      : 'border-border hover:border-accent/30 cursor-grab active:cursor-grabbing'
                                  }`}
                                >
                                  {isProcessing && (
                                    <div className="absolute inset-0 bg-surface/60 backdrop-blur-[0.5px] flex items-center justify-center gap-1.5 text-[9px] text-accent font-semibold animate-pulse">
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-accent border-t-transparent flex-shrink-0" />
                                      <span>Updating...</span>
                                    </div>
                                  )}
                                  <p className="font-semibold text-text-1">{t.title}</p>
                                  <div className="flex justify-between items-center text-[9px]">
                                    <Badge variant={t.priority === 'high' || t.priority === 'urgent' ? 'danger' : 'secondary'}>
                                      {t.priority}
                                    </Badge>
                                    <span className="text-text-3">Est: {t.estimatedHours}h</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab: Time Entries */}
            {activeTab === 'time' && (
              <div className="space-y-3 animate-in fade-in duration-200 max-h-[400px] overflow-y-auto">
                <h5 className="text-xs font-bold text-text-3 uppercase">Logged Time Entries</h5>
                {projectDetail.timeEntries.length === 0 ? (
                  <p className="text-xs text-text-3">No hours logged on this project yet.</p>
                ) : (
                  projectDetail.timeEntries.map((entry: any) => (
                    <div key={entry.id} className="p-3 border border-border bg-surface-2/20 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-text-1">{entry.description || 'General support'}</p>
                        <p className="text-[10px] text-text-3 mt-0.5">{formatDate(entry.startedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-accent">{durationToHours(entry.durationMinutes)}</p>
                        <span className="text-[9px] text-text-3 font-semibold uppercase">{entry.isBillable ? 'Billable' : 'Non-Billable'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* QUICK ADD TASK MODAL */}
      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="Add Task to Checklist" type="center">
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
          <Input
            label="Task Title / Goal *"
            placeholder="e.g. Design homepage mockup"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent 🚨' },
              ]}
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as any)}
            />
            <Input
              label="Due Date"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />
            <Input
              label="Est. Hours"
              type="number"
              min="0"
              value={taskEstHours}
              onChange={(e) => setTaskEstHours(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
