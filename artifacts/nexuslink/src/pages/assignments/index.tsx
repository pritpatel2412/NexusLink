import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldAlert, Plus, ShieldCheck, Calendar, Activity, 
  Trash2, AlertTriangle, Play, Sparkles, RefreshCw, FileText 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssignmentJournal {
  id: string;
  taskId: string;
  thoughtFootprint: string;
  notes: string;
  feedback: string | null;
  status: string;
  redFlagScore: number;
  redFlags: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  contactName: string | null;
  journal: AssignmentJournal | null;
}

export default function AssignmentShieldPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // New assignment form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [thoughtFootprint, setThoughtFootprint] = useState("");
  const [notes, setNotes] = useState("");

  // Editing state
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editFootprint, setEditFootprint] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFeedback, setEditFeedback] = useState("");

  // Autopsy loading state
  const [autopsyLoadingId, setAutopsyLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueDate,
          priority,
          thoughtFootprint,
          notes
        })
      });

      if (res.ok) {
        toast({ title: "Assignment Shield Activated", description: "Successfully tracking this technical assignment." });
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        setThoughtFootprint("");
        setNotes("");
        setShowAddForm(false);
        fetchAssignments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (asm: Assignment) => {
    setEditingAssignmentId(asm.id);
    setEditFootprint(asm.journal?.thoughtFootprint || "");
    setEditNotes(asm.journal?.notes || "");
    setEditFeedback(asm.journal?.feedback || "");
  };

  const handleUpdate = async (taskId: string) => {
    try {
      const res = await fetch(`/api/assignments/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thoughtFootprint: editFootprint,
          notes: editNotes,
          feedback: editFeedback
        })
      });

      if (res.ok) {
        toast({ title: "Journal Log Saved", description: "Progress logs updated." });
        setEditingAssignmentId(null);
        fetchAssignments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runAutopsy = async (taskId: string) => {
    setAutopsyLoadingId(taskId);
    try {
      const res = await fetch(`/api/assignments/${taskId}/autopsy`, {
        method: "POST"
      });

      if (res.ok) {
        toast({
          title: "AI Autopsy Complete!",
          description: "Red Flag score calculated successfully."
        });
        fetchAssignments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAutopsyLoadingId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (score >= 40) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            <span>Assignment Shield</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track interview take-homes, log thought footprint history, detect spec creep, and run AI autopsies.
          </p>
        </div>

        <div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 gap-2 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Shield New Assignment</span>
          </Button>
        </div>
      </div>

      {/* Form Drawer (Glassmorphic) */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-card/25 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Track Take-Home Project</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Assignment Title</label>
              <Input 
                placeholder="e.g. Build full-stack calendar indexing system" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Due Date</label>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-secondary/40 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium font-display">Prompt / Specifications</label>
            <Textarea 
              placeholder="Paste company instructions or original spec."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/40 border-white/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Initial Thought Footprint</label>
            <Textarea 
              placeholder="How many hours did they quote? What are your initial architectural design thoughts?"
              value={thoughtFootprint}
              onChange={(e) => setThoughtFootprint(e.target.value)}
              className="bg-secondary/40 border-white/10"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
              Initialize Shield
            </Button>
            <Button variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Assignments Workspace */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Checking Shield Logs...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-card/10">
          <p className="text-muted-foreground mb-4">No technical interview assignments are currently under shield protection.</p>
          <Button onClick={() => setShowAddForm(true)} variant="outline">Protect Your First Project</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {assignments.map((asm) => {
            const hasAutopsy = asm.journal?.redFlags && asm.journal.redFlags !== "[]";
            const autopsyData = hasAutopsy ? JSON.parse(asm.journal?.redFlags || "{}") : null;
            const isEditing = editingAssignmentId === asm.id;

            return (
              <div key={asm.id} className="bg-card/20 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                {/* Visual side-marker for priority */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${asm.priority === "high" ? "bg-red-500" : "bg-primary"}`} />

                {/* Info Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{asm.title}</span>
                      <span className="text-xs bg-secondary/80 text-gray-300 border border-white/5 px-2 py-0.5 rounded-full capitalize">
                        {asm.status}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground items-center">
                      {asm.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due: {new Date(asm.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                      {asm.contactName && <span>Contact: {asm.contactName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => startEdit(asm)}>
                        Update Journal Log
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-green-400 border-green-500/20 hover:bg-green-500/5" onClick={() => handleUpdate(asm.id)}>
                        Save Journal Logs
                      </Button>
                    )}

                    <Button 
                      disabled={autopsyLoadingId === asm.id}
                      onClick={() => runAutopsy(asm.id)}
                      className="bg-primary text-white hover:bg-primary/90 gap-1.5 size-sm text-xs font-semibold shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      <span>{autopsyLoadingId === asm.id ? "Analyzing Take-Home..." : "Run AI Autopsy"}</span>
                    </Button>
                  </div>
                </div>

                {/* Prompt Spec */}
                {asm.description && (
                  <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 space-y-1 text-sm">
                    <span className="text-xs font-bold text-muted-foreground block uppercase">Prompt Specifications</span>
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{asm.description}</p>
                  </div>
                )}

                {/* Double Column Journal & Autopsy */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column: Progress logs & Journal entries */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Developer Thought Footprint & Spec Log</span>
                    </h4>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Thought Footprint (log hours worked, unexpected additions)</label>
                          <Textarea 
                            value={editFootprint}
                            onChange={(e) => setEditFootprint(e.target.value)}
                            className="bg-secondary/40 border-white/10 h-24"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Technical & Communication Notes</label>
                          <Textarea 
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="bg-secondary/40 border-white/10 h-24"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Interviewer Feedback (Ghost notices, creep events)</label>
                          <Textarea 
                            value={editFeedback}
                            onChange={(e) => setEditFeedback(e.target.value)}
                            className="bg-secondary/40 border-white/10 h-24"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-secondary/10 p-4 rounded-xl border border-white/5 space-y-2">
                          <span className="text-xs font-bold text-muted-foreground block">Active Footprint Log</span>
                          <p className="text-sm text-gray-300 leading-relaxed italic">
                            {asm.journal?.thoughtFootprint || "No thought footprints logged yet. Click 'Update Journal Log' to add specs or hourly creep warnings."}
                          </p>
                        </div>
                        <div className="bg-secondary/10 p-4 rounded-xl border border-white/5 space-y-2">
                          <span className="text-xs font-bold text-muted-foreground block">Technical Notes</span>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {asm.journal?.notes || "No technical comments logged."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: AI Autopsy Result */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>Post-Interview AI Rejection Autopsy</span>
                    </h4>

                    {autopsyData ? (
                      <div className="bg-card/30 border border-white/5 rounded-2xl p-5 shadow-2xl space-y-5 relative">
                        
                        {/* Red Flag Meter */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground block">Process Red Flag Score</span>
                            <span className="text-xs text-muted-foreground">Threshold warning &gt;60%</span>
                          </div>
                          <div className={`px-4 py-2 border rounded-xl font-display font-extrabold text-xl ${getScoreColor(autopsyData.redFlagScore)}`}>
                            {autopsyData.redFlagScore}%
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground block uppercase">Autopsy Verdict</span>
                          <p className="text-sm text-gray-200 leading-relaxed italic">
                            "{autopsyData.autopsySummary}"
                          </p>
                        </div>

                        {/* List of Red Flags */}
                        {autopsyData.redFlagsList?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs text-muted-foreground block uppercase">Detected Violations</span>
                            <div className="flex flex-wrap gap-1.5">
                              {autopsyData.redFlagsList.map((rf: string, rIdx: number) => (
                                <span key={rIdx} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/10 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                  <span>{rf}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* What went wrong & learnings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                          <div className="space-y-1">
                            <span className="text-xs text-red-400 font-bold block uppercase">Diagnostic Errors</span>
                            <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                              {autopsyData.whatWentWrong?.map((w: string, wIdx: number) => (
                                <li key={wIdx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-emerald-400 font-bold block uppercase">Candidate Learnings</span>
                            <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                              {autopsyData.candidateLearnings?.map((l: string, lIdx: number) => (
                                <li key={lIdx}>{l}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="bg-card/10 border border-dashed border-white/5 rounded-2xl p-8 text-center space-y-3">
                        <AlertTriangle className="w-6 h-6 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                          No post-mortem audit run. When this project finishes or if spec-creep goes out of bounds, run AI Autopsy to diagnose process health.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
