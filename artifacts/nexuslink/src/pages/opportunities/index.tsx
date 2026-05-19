import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Compass, Plus, ArrowLeft, ArrowRight, Trash2, 
  Sparkles, DollarSign, BellRing, Briefcase, Info, Eye 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Opportunity {
  id: string;
  companyName: string;
  roleTitle: string;
  salaryRange: string | null;
  stage: string;
  signals: string | null;
  notes: string | null;
}

interface CrawlerAlert {
  id: string;
  type: string;
  company: string;
  title: string;
  text: string;
  timestamp: string;
}

const STAGES = [
  { id: "identified", label: "Identified" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "archived", label: "Archived" }
];

export default function OpportunityIntelligencePage() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [alerts, setAlerts] = useState<CrawlerAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [notes, setNotes] = useState("");
  const [signals, setSignals] = useState("");

  useEffect(() => {
    fetchOpportunities();
    fetchAlerts();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch("/api/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/opportunities/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !roleTitle) {
      toast({ title: "Company and Role are required.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          roleTitle,
          salaryRange,
          stage: "identified",
          signals,
          notes
        })
      });

      if (res.ok) {
        toast({ title: "Opportunity Logged", description: "Successfully added to your pipeline board." });
        setCompanyName("");
        setRoleTitle("");
        setSalaryRange("");
        setNotes("");
        setSignals("");
        setShowAddForm(false);
        fetchOpportunities();
        fetchAlerts(); // refresh crawler alerts for newly targeted companies
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveStage = async (id: string, currentStage: string, direction: "left" | "right") => {
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);
    let nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= STAGES.length) return;
    const nextStage = STAGES[nextIndex].id;

    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage })
      });

      if (res.ok) {
        fetchOpportunities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this opportunity from your tracker?")) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Opportunity Removed" });
        fetchOpportunities();
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <Compass className="w-8 h-8 text-primary shrink-0 animate-spin-slow" />
            <span>Opportunity Intelligence Board</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Glassmorphic Kanban board with automatic live crawler signals matching your key targeted companies.
          </p>
        </div>

        <div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 gap-2 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Target New Company</span>
          </Button>
        </div>
      </div>

      {/* Form Drawer (Glassmorphic) */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-card/25 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Track Target Company</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Company Name</label>
              <Input 
                placeholder="e.g. Vercel, Supabase" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Role / Title</label>
              <Input 
                placeholder="e.g. Senior Frontend Architect" 
                value={roleTitle} 
                onChange={(e) => setRoleTitle(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Salary / Compensation Target</label>
              <Input 
                placeholder="e.g. $140,000 - $160,000" 
                value={salaryRange} 
                onChange={(e) => setSalaryRange(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Signals / Keyword triggers (Comma separated)</label>
              <Input 
                placeholder="e.g. raised, expansion, React" 
                value={signals} 
                onChange={(e) => setSignals(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Internal Notes & Context</label>
            <Textarea 
              placeholder="Add key insights, stack used, or timeline details."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/40 border-white/10"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
              Add Opportunity
            </Button>
            <Button variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Main Grid: Kanban Workspace + Crawler Intelligence Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left 3 Columns: Kanban Board */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <span>Interactive Kanban Pipeline</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {STAGES.map((col) => {
              const colOpps = opportunities.filter(o => o.stage === col.id);

              return (
                <div key={col.id} className="bg-card/10 border border-white/5 rounded-2xl p-4 min-w-[200px] flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-bold text-sm text-white tracking-wide uppercase">{col.label}</span>
                    <span className="text-xs bg-secondary/80 text-gray-400 px-2 py-0.5 rounded-full font-bold">
                      {colOpps.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 min-h-[300px]">
                    {colOpps.map((opp) => (
                      <div key={opp.id} className="bg-card/30 border border-white/5 hover:border-primary/20 p-4 rounded-xl shadow-lg relative flex flex-col justify-between group space-y-3 hover:scale-[1.01] transition-all">
                        <button 
                          onClick={() => handleDelete(opp.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white">{opp.companyName}</h4>
                          <p className="text-xs text-muted-foreground">{opp.roleTitle}</p>
                          {opp.salaryRange && (
                            <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded mt-1">
                              <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{opp.salaryRange}</span>
                            </span>
                          )}
                        </div>

                        {opp.notes && (
                          <p className="text-[11px] text-gray-400 line-clamp-2 italic">
                            "{opp.notes}"
                          </p>
                        )}

                        {opp.signals && (
                          <div className="flex flex-wrap gap-1">
                            {opp.signals.split(",").map((s, sIdx) => (
                              <span key={sIdx} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/10 font-medium">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Kanban Transition Controls */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                          <button 
                            onClick={() => moveStage(opp.id, opp.stage, "left")}
                            className="text-muted-foreground hover:text-white disabled:opacity-30"
                            disabled={opp.stage === "identified"}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase">Move Stage</span>
                          <button 
                            onClick={() => moveStage(opp.id, opp.stage, "right")}
                            className="text-muted-foreground hover:text-white disabled:opacity-30"
                            disabled={opp.stage === "archived"}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))}
                    
                    {colOpps.length === 0 && (
                      <div className="text-center py-12 text-xs text-muted-foreground italic border border-dashed border-white/5 rounded-xl bg-card/5">
                        Empty Stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Live crawler signals & alerts */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#141421] to-[#0A0A0F] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-6 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

            <div className="space-y-2 border-b border-white/5 pb-4">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-primary animate-bounce" />
                <span>Industry Crawler Alerts</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Automatic startup signals, VC hiring events, and funding rounds crawler logs.
              </p>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">Crawl engine initializing...</div>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="bg-card/45 border border-white/5 hover:border-primary/20 rounded-xl p-4.5 space-y-2.5 transition-all shadow-md">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-white uppercase tracking-wider">{al.company}</span>
                      <span className={`px-2 py-0.5 rounded border uppercase text-[9px] ${
                        al.type === "funding" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" : "text-primary bg-primary/10 border-primary/10"
                      }`}>
                        {al.type}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-gray-200">{al.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {al.text}
                    </p>

                    <div className="text-[9px] text-muted-foreground flex items-center justify-between pt-1 border-t border-white/5">
                      <span>CRAWLED LIVE</span>
                      <span>Just now</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
