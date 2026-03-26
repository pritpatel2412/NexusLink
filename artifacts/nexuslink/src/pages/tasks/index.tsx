import { useState } from "react";
import { Link } from "wouter";
import { format, isPast, isToday } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTasks, useCreateTask, useUpdateTask, useDeleteTask,
  useListContacts, getListTasksQueryKey
} from "@workspace/api-client-react";
import {
  CheckSquare, Plus, Loader2, Trash2, Flag, User, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "text-emerald-400", bg: "bg-emerald-400/10" },
  medium: { label: "Medium", color: "text-amber-400",   bg: "bg-amber-400/10" },
  high:   { label: "High",   color: "text-rose-400",    bg: "bg-rose-400/10" },
};

const STATUS_TABS = [
  { value: "all",     label: "All" },
  { value: "pending", label: "Pending" },
  { value: "done",    label: "Completed" },
];

function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [contactId, setContactId] = useState("none");

  const { data: contacts } = useListContacts({});
  const { mutateAsync: createTask, isPending } = useCreateTask();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          priority: priority as any,
          contactId: contactId !== "none" ? contactId : undefined,
        }
      });
      qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
      toast({ title: "Task created!" });
      setTitle(""); setDescription(""); setDueDate(""); setPriority("medium"); setContactId("none");
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to create task" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Title *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Follow up with Alex"
              className="bg-background/50 border-white/10"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Description</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes..."
              className="bg-background/50 border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-background/50 border-white/10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Link to Contact</label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 max-h-48 overflow-y-auto">
                <SelectItem value="none">None</SelectItem>
                {contacts?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 bg-transparent">Cancel</Button>
            <Button type="submit" disabled={isPending || !title.trim()} className="bg-primary hover:bg-primary/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TasksPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: tasks, isLoading } = useListTasks(
    statusFilter !== "all" ? { status: statusFilter } : {},
    { query: { staleTime: 30_000 } }
  );

  const { mutateAsync: updateTask } = useUpdateTask();
  const { mutateAsync: deleteTask } = useDeleteTask();

  async function toggleTask(task: any) {
    try {
      await updateTask({ id: task.id, data: { status: task.status === "done" ? "pending" : "done" } });
      qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Failed to update task" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask({ id });
      qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
      toast({ title: "Task deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete task" });
    }
  }

  const pending = tasks?.filter(t => t.status === "pending") || [];
  const done = tasks?.filter(t => t.status === "done") || [];
  const displayTasks = statusFilter === "all" ? [...pending, ...done] : (tasks || []);

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Stay on top of your follow-ups and commitments.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-border/50 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              statusFilter === tab.value
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-xl text-white mb-2">No tasks here</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Create a task to track follow-ups and commitments.</p>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayTasks.map((task) => {
            const pri = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
            const isDone = task.status === "done";
            const isOverdue = !isDone && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
            const isDueToday = !isDone && task.dueDate && isToday(new Date(task.dueDate));
            return (
              <div
                key={task.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 flex items-start gap-4 group hover:border-border transition-colors",
                  isDone ? "border-border/30 opacity-60" : "border-border/50"
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isDone
                      ? "bg-primary border-primary"
                      : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {isDone && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("font-medium text-white leading-tight", isDone && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", pri.bg, pri.color)}>
                        {pri.label}
                      </span>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {task.dueDate && (
                      <span className={cn(
                        "flex items-center gap-1 text-xs font-mono",
                        isOverdue ? "text-rose-400" : isDueToday ? "text-amber-400" : "text-muted-foreground"
                      )}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? "Overdue · " : isDueToday ? "Today · " : ""}
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                    {task.contactName && (
                      <Link href={`/contacts/${task.contactId}`}>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer">
                          <User className="w-3 h-3" />
                          {task.contactName}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTaskDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
