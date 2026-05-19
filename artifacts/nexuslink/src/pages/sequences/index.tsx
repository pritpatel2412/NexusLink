import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, Plus, Sparkles, Copy, Check, Info, Trash2, 
  Play, Pause, RefreshCw, AlertTriangle, ShieldCheck 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SequenceStep {
  dayOffset: number;
  subject: string;
  template: string;
}

interface Sequence {
  id: string;
  name: string;
  steps: string; // JSON string
  status: string;
}

export default function GhostRecoveryPage() {
  const { toast } = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  // New sequence form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [step1Offset, setStep1Offset] = useState(3);
  const [step1Sub, setStep1Sub] = useState("Quick update");
  const [step1Body, setStep1Body] = useState("");
  const [step2Offset, setStep2Offset] = useState(7);
  const [step2Sub, setStep2Sub] = useState("Value contribution");
  const [step2Body, setStep2Body] = useState("");

  // Desperation Checker state
  const [draftMessage, setDraftMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const res = await fetch("/api/sequences");
      if (res.ok) {
        const data = await res.json();
        setSequences(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Sequence name is required.", variant: "destructive" });
      return;
    }

    const stepsArray: SequenceStep[] = [
      { dayOffset: step1Offset, subject: step1Sub, template: step1Body },
      { dayOffset: step2Offset, subject: step2Sub, template: step2Body }
    ];

    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          steps: stepsArray,
          status: "active"
        })
      });

      if (res.ok) {
        toast({ title: "Recovery Campaign Initiated", description: "Follow-up sequence created." });
        setName("");
        setStep1Body("");
        setStep2Body("");
        setShowAddForm(false);
        fetchSequences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (seq: Sequence) => {
    const nextStatus = seq.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/sequences/${seq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchSequences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this outreach sequence permanently?")) return;
    try {
      const res = await fetch(`/api/sequences/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Sequence Deleted" });
        fetchSequences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runAnalysis = async () => {
    if (!draftMessage.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/sequences/analyze-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: draftMessage })
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        toast({
          title: "Outreach Analysis Complete!",
          description: "Tone check successfully mapped for triggers."
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (score >= 30) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary shrink-0" />
            <span>Ghost Recovery Engine</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated multi-step outreach schedules and AI desperation checks to recover cold leads without losing posture.
          </p>
        </div>

        <div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 gap-2 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Sequence</span>
          </Button>
        </div>
      </div>

      {/* Form Drawer (Glassmorphic) */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-card/25 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Build Recovery follow-up sequence</h2>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Sequence Campaign Name</label>
            <Input 
              placeholder="e.g. Late-stage Interview Ghost Recovery" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/40 border-white/10"
            />
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-primary">STEP 1: Initial Pulse follow-up</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Day Offset</label>
                <Input 
                  type="number" 
                  value={step1Offset} 
                  onChange={(e) => setStep1Offset(parseInt(e.target.value))}
                  className="bg-secondary/40 border-white/10"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-muted-foreground">Subject Line</label>
                <Input 
                  value={step1Sub} 
                  onChange={(e) => setStep1Sub(e.target.value)}
                  className="bg-secondary/40 border-white/10"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Outreach Message Body</label>
              <Textarea 
                placeholder="High-value checking in template."
                value={step1Body}
                onChange={(e) => setStep1Body(e.target.value)}
                className="bg-secondary/40 border-white/10 h-20"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-primary">STEP 2: High affinity Value Drop</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Day Offset</label>
                <Input 
                  type="number" 
                  value={step2Offset} 
                  onChange={(e) => setStep2Offset(parseInt(e.target.value))}
                  className="bg-secondary/40 border-white/10"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-muted-foreground">Subject Line</label>
                <Input 
                  value={step2Sub} 
                  onChange={(e) => setStep2Sub(e.target.value)}
                  className="bg-secondary/40 border-white/10"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Outreach Message Body</label>
              <Textarea 
                placeholder="Share a live deployment update or relevant industry case study hook."
                value={step2Body}
                onChange={(e) => setStep2Body(e.target.value)}
                className="bg-secondary/40 border-white/10 h-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
              Launch Sequence
            </Button>
            <Button variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Main Grid: Active Campaigns & Desperation Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Outreach Sequences */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Active Follow-up Campaigns</span>
          </h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Syncing recovery hooks...</div>
          ) : sequences.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-card/10">
              <p className="text-muted-foreground mb-4">No ghost-recovery follow-up campaigns configured.</p>
              <Button onClick={() => setShowAddForm(true)} variant="outline">Setup Your First Sequence</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sequences.map((seq) => {
                const steps: SequenceStep[] = JSON.parse(seq.steps || "[]");

                return (
                  <div key={seq.id} className="bg-card/20 border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:scale-[1.005] transition-all group">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-md tracking-tight">{seq.name}</h4>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Sequence Campaign</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleStatus(seq)}
                          className="h-8 w-8 text-muted-foreground hover:text-white"
                        >
                          {seq.status === "active" ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(seq.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Step Cards Trail */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {steps.map((st, sIdx) => (
                        <div key={sIdx} className="bg-secondary/15 p-4 rounded-xl border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase">
                            <span>Step {sIdx + 1}</span>
                            <span>Day +{st.dayOffset}</span>
                          </div>
                          <h5 className="font-bold text-xs text-gray-200 truncate">Sub: {st.subject}</h5>
                          <p className="text-[11px] text-gray-400 line-clamp-3 italic">
                            "{st.template || "No template template written."}"
                          </p>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Desperation Alert Checker */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#141421] to-[#0A0A0F] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span>Desperation Alert Coach</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Paste your outreach follow-up email/message here. AI scans for pleading tones, exclamation marks, or submissive words that kill your professional leverage.
              </p>
            </div>

            <div className="space-y-4">
              <Textarea 
                placeholder="Hi, sorry to bug you again, just checking in if you got a chance to review my dashboard? I am really looking forward to joining, please let me know..." 
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                className="bg-secondary/40 border-white/10 h-32 text-sm text-white"
              />

              <Button 
                onClick={runAnalysis}
                disabled={analyzing || !draftMessage.trim()}
                className="w-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-2 shadow-lg"
              >
                {analyzing ? "Coaching tone..." : "Scan Outreach Tone"}
              </Button>
            </div>

            {/* Analysis Result */}
            {analysisResult && (
              <div className="border border-white/5 bg-card/25 p-5 rounded-2xl shadow-xl space-y-5 animate-in fade-in duration-200">
                
                {/* Desperation Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground block">Desperation Score</span>
                    <span className="text-xs text-muted-foreground">Alert threshold >40%</span>
                  </div>
                  <div className={`px-3 py-1.5 border rounded-xl font-display font-extrabold text-lg text-center ${getScoreColor(analysisResult.desperationScore)}`}>
                    {analysisResult.desperationScore}%
                  </div>
                </div>

                {/* Offending Triggers */}
                {analysisResult.triggers?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-red-400 font-bold block uppercase">Leverage Killers Found</span>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.triggers.map((trig: string, tIdx: number) => (
                        <span key={tIdx} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/10 font-medium">
                          {trig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coach Suggestions */}
                {analysisResult.suggestions?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block uppercase">Tone Suggestions</span>
                    <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                      {analysisResult.suggestions.map((sug: string, sIdx: number) => (
                        <li key={sIdx}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rewritten high-posture copy */}
                {analysisResult.rewrittenMessage && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>HIGH-POSTURE REWRITE</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(analysisResult.rewrittenMessage);
                          toast({ title: "Rewrite Copied!", description: "High-value message ready to send." });
                        }} 
                        className="hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-200 italic leading-relaxed whitespace-pre-wrap">
                      "{analysisResult.rewrittenMessage}"
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
