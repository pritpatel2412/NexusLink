import { useState } from "react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetContact, useCreateInteraction, useCreateTask, useUpdateTask,
  useGenerateAiBrief, getGetContactQueryKey, getListTasksQueryKey
} from "@workspace/api-client-react";
import {
  ArrowLeft, Edit, Mail, MapPin, Briefcase, Phone, Plus,
  MessageSquare, Calendar, Sparkles, CheckSquare, Loader2,
  FileText, X, Globe, Linkedin
} from "lucide-react";
import { RelationshipScore } from "@/components/ai/RelationshipScore";
import { SmartSummarizer } from "@/components/ai/SmartSummarizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getInitials, generateGradient, cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

// ── Log Interaction Modal ────────────────────────────────────────────
function LogInteractionModal({
  open, onClose, contactId, contactName
}: { open: boolean; onClose: () => void; contactId: string; contactName: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [type, setType] = useState("meeting");
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const { mutateAsync: createInteraction, isPending } = useCreateInteraction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    try {
      await createInteraction({ data: { contactId, type, summary: summary.trim(), occurredAt, source: "manual" } });
      qc.invalidateQueries({ queryKey: getGetContactQueryKey(contactId) });
      toast({ title: "Interaction logged!" });
      setSummary(""); setType("meeting");
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to log interaction" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Log Interaction</DialogTitle>
          <p className="text-sm text-muted-foreground">with {contactName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                {["meeting", "call", "email", "message", "note"].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">When</label>
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={e => setOccurredAt(e.target.value)}
              className="bg-background/50 border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Summary *</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="What did you discuss? Key takeaways?"
              rows={4}
              className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 bg-transparent">Cancel</Button>
            <Button type="submit" disabled={isPending || !summary.trim()} className="bg-primary hover:bg-primary/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Interaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────
function AddTaskModal({
  open, onClose, contactId, contactName
}: { open: boolean; onClose: () => void; contactId: string; contactName: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const { mutateAsync: createTask, isPending } = useCreateTask();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask({ data: { contactId, title: title.trim(), dueDate: dueDate || undefined, priority: priority as any } });
      qc.invalidateQueries({ queryKey: getGetContactQueryKey(contactId) });
      qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
      toast({ title: "Task added!" });
      setTitle(""); setDueDate(""); setPriority("medium");
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to add task" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Task</DialogTitle>
          <p className="text-sm text-muted-foreground">for {contactName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Task Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Send proposal" className="bg-background/50 border-white/10" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Due Date</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-background/50 border-white/10" />
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
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 bg-transparent">Cancel</Button>
            <Button type="submit" disabled={isPending || !title.trim()} className="bg-primary hover:bg-primary/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── AI Brief Panel ─────────────────────────────────────────────────────
function AiBriefPanel({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const { mutateAsync: generateBrief, isPending, data } = useGenerateAiBrief();
  const [briefText, setBriefText] = useState<string | null>(null);

  async function generate() {
    try {
      const result = await generateBrief({ data: { contactId } });
      setBriefText((result as any).brief || "No brief generated.");
    } catch {
      setBriefText("Failed to generate brief. Please try again.");
    }
  }

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-white">AI Brief</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!briefText ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">Generate a pre-meeting brief with key context about this contact.</p>
          <Button onClick={generate} disabled={isPending} className="bg-primary hover:bg-primary/90 text-white">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating…</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Brief</>}
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-background/40 rounded-xl p-4 border border-white/5">
            {briefText}
          </div>
          <Button variant="ghost" size="sm" onClick={generate} disabled={isPending} className="mt-3 text-primary hover:bg-primary/10">
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}

// ── INTERACTION ICONS ─────────────────────────────────────────────────
const INTERACTION_ICONS: Record<string, React.ComponentType<any>> = {
  meeting: Calendar,
  call: Phone,
  email: Mail,
  message: MessageSquare,
  note: FileText,
};
const INTERACTION_COLORS: Record<string, string> = {
  meeting: "text-emerald-400",
  call: "text-blue-400",
  email: "text-primary",
  message: "text-violet-400",
  note: "text-amber-400",
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────
export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: contact, isLoading } = useGetContact(id);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { mutateAsync: updateTask } = useUpdateTask();

  async function toggleTask(taskId: string, currentStatus: string) {
    try {
      await updateTask({ id: taskId, data: { status: currentStatus === "done" ? "pending" : "done" } });
      qc.invalidateQueries({ queryKey: getGetContactQueryKey(id) });
    } catch {
      toast({ variant: "destructive", title: "Failed to update task" });
    }
  }

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!contact) {
    return <div className="p-8 text-center text-muted-foreground">Contact not found.</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur shrink-0">
        <Link href="/contacts" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Hero Section */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <div className={cn("w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-background", generateGradient(contact.id))}>
                {getInitials(contact.name)}
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">{contact.name}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                  {contact.role && contact.company && (
                    <span className="flex items-center gap-1.5 text-gray-300 font-medium"><Briefcase className="w-4 h-4" /> {contact.role} @ {contact.company}</span>
                  )}
                  {contact.role && !contact.company && (
                    <span className="flex items-center gap-1.5 text-gray-300 font-medium"><Briefcase className="w-4 h-4" /> {contact.role}</span>
                  )}
                  {contact.location && (
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {contact.location}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {contact.tags?.map(tag => (
                    <span key={tag.id} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white shadow-sm">{tag.tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 relative z-10 w-full md:w-auto">
              <Button
                className="flex-1 md:w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                onClick={() => setShowLogInteraction(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Log Interaction
              </Button>
              <Button
                variant="outline"
                className="flex-1 md:w-full bg-transparent border-white/10 hover:bg-white/5"
                onClick={() => setShowBrief(v => !v)}
              >
                <Sparkles className="w-4 h-4 mr-2 text-accent" /> {showBrief ? "Hide Brief" : "Meeting Brief"}
              </Button>
              <SmartSummarizer contactId={id} />
            </div>
          </div>

          {/* AI Brief Panel (inline) */}
          {showBrief && (
            <AiBriefPanel contactId={id} onClose={() => setShowBrief(false)} />
          )}

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Interaction Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                  <h2 className="font-display text-xl font-semibold text-white">Interaction History</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10"
                    onClick={() => setShowLogInteraction(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                {(!contact.interactions || contact.interactions.length === 0) ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">No interactions logged yet.</p>
                    <Button variant="outline" className="border-white/10 bg-transparent" onClick={() => setShowLogInteraction(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Log First Interaction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 pl-4 border-l-2 border-border/50">
                    {contact.interactions.map((interaction) => {
                      const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare;
                      const color = INTERACTION_COLORS[interaction.type] || "text-primary";
                      return (
                        <div key={interaction.id} className="relative">
                          <div className="absolute -left-[21px] p-1.5 bg-card rounded-full border border-border shadow-sm">
                            <Icon className={cn("w-4 h-4", color)} />
                          </div>
                          <div className="pl-6">
                            <div className="bg-secondary/40 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-white capitalize">{interaction.type}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(interaction.occurredAt), "MMM d, yyyy")}</span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">{interaction.summary}</p>
                              <div className="mt-3">
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-muted-foreground border border-white/5">
                                  via {interaction.source}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI Score + Info + Tasks */}
            <div className="space-y-6">

              {/* AI Relationship Intelligence Score */}
              <RelationshipScore contactId={id} />

              {/* Contact Info */}
              <div className="bg-card border border-border/50 rounded-3xl p-6">
                <h3 className="font-display font-semibold text-white mb-4">Contact Info</h3>
                <div className="space-y-3 text-sm">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-gray-300 break-all group-hover:text-white transition-colors">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-400/10 transition-colors">
                        <Phone className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors">{contact.phone}</span>
                    </a>
                  )}
                  {contact.linkedinUrl && (
                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 transition-colors">
                        <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors truncate">LinkedIn Profile</span>
                    </a>
                  )}
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-400/10 transition-colors">
                        <Globe className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors truncate">Website</span>
                    </a>
                  )}
                  {contact.whereMet && (
                    <div className="pt-4 mt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Where We Met</p>
                      <p className="text-gray-300">{contact.whereMet}</p>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{contact.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Panel */}
              <div className="bg-card border border-border/50 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-semibold text-white">Tasks</h3>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary" onClick={() => setShowAddTask(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {contact.tasks?.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">No tasks yet.</p>
                      <Button variant="outline" size="sm" className="border-white/10 bg-transparent text-xs" onClick={() => setShowAddTask(true)}>
                        <Plus className="w-3 h-3 mr-1" /> Add Task
                      </Button>
                    </div>
                  )}
                  {contact.tasks?.map(task => (
                    <div key={task.id} className={cn("flex gap-3 items-start p-3 rounded-xl border transition-colors", task.status === "done" ? "border-white/5 opacity-50" : "border-white/5 bg-secondary/20 hover:border-white/10")}>
                      <button
                        onClick={() => toggleTask(task.id, task.status)}
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                          task.status === "done" ? "bg-primary border-primary" : "border-muted-foreground hover:border-primary"
                        )}
                      >
                        {task.status === "done" && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium leading-tight", task.status === "done" ? "line-through text-muted-foreground" : "text-white")}>{task.title}</p>
                        {task.dueDate && <p className="text-xs text-amber-500 font-mono mt-0.5">{format(new Date(task.dueDate), "MMM d")}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogInteractionModal open={showLogInteraction} onClose={() => setShowLogInteraction(false)} contactId={id} contactName={contact.name} />
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} contactId={id} contactName={contact.name} />
    </div>
  );
}
