import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Compass, Plus, ArrowLeft, ArrowRight, Trash2, 
  Sparkles, DollarSign, BellRing, Briefcase, Info, Eye,
  Search, UserCheck, Globe, Linkedin, MapPin, Loader2
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

  // New discovery search engine states
  const [activeView, setActiveView] = useState<"board" | "discovery">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingJobId, setImportingJobId] = useState<string | null>(null);

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
    handleSearchDiscovery("");
  }, []);

  const handleSearchDiscovery = async (queryOverride?: string) => {
    const q = queryOverride !== undefined ? queryOverride : searchQuery;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/opportunities/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setScrapedJobs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportJob = async (job: any) => {
    setImportingJobId(job.id);
    try {
      const res = await fetch("/api/opportunities/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: job.companyName,
          roleTitle: job.roleTitle,
          salaryRange: job.salaryRange,
          description: job.description,
          recruiter: job.recruiters && job.recruiters.length > 0 ? job.recruiters[0] : null
        })
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Pipeline Sync Successful!",
          description: result.contact 
            ? `Tracked opportunity at ${job.companyName} and linked HR contact ${result.contact.name} in CRM!`
            : `Tracked opportunity at ${job.companyName} in pipeline.`
        });
        fetchOpportunities();
        // Mark imported locally
        setScrapedJobs(prev => prev.filter(j => j.id !== job.id));
      } else {
        toast({ title: "Failed to import listing", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error importing listing", variant: "destructive" });
    } finally {
      setImportingJobId(null);
    }
  };

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

      {/* View Switcher Tabs */}
      <div className="flex items-center border-b border-white/5 pb-1 gap-6">
        <button 
          onClick={() => setActiveView("board")}
          className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 relative ${
            activeView === "board" 
              ? "text-primary border-primary" 
              : "text-muted-foreground border-transparent hover:text-white"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Pipeline Kanban</span>
        </button>
        <button 
          onClick={() => setActiveView("discovery")}
          className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 relative ${
            activeView === "discovery" 
              ? "text-primary border-primary" 
              : "text-muted-foreground border-transparent hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <span className="flex items-center gap-1.5">
            <span>AI Job Scraper & Discovery</span>
            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold animate-pulse">
              Live Agent
            </span>
          </span>
        </button>
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
              onChange={(e: any) => setNotes(e.target.value)}
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

      {/* Main Grid: Kanban Workspace / Discovery + Crawler Intelligence Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {activeView === "board" ? (
          /* Left 3 Columns: Kanban Board */
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
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
        ) : (
          /* Left 3 Columns: AI Job Scraper & Discovery Panel */
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span>AI Job Scraper & Contact Discovery</span>
              </h2>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tinyfish Web Scraper Active</span>
              </div>
            </div>

            {/* Search Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchDiscovery();
              }} 
              className="flex gap-3 bg-card/10 border border-white/5 p-3 rounded-2xl shadow-xl backdrop-blur-md"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by keywords, companies, or tech stack (e.g. Supabase Postgres, Vercel React)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/20 border-white/5 w-full h-11 text-white placeholder-muted-foreground focus:ring-accent"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSearching}
                className="bg-gradient-to-r from-accent to-[#FF3366] text-white hover:scale-[1.02] active:scale-[0.98] transition-all px-6 h-11 gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search Agent</span>
              </Button>
            </form>

            {/* Results Board */}
            <div className="space-y-4">
              {isSearching ? (
                <div className="text-center py-20 space-y-4 bg-card/5 border border-dashed border-white/5 rounded-2xl">
                  <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Launching Tinyfish Web Crawlers...</p>
                    <p className="text-xs text-muted-foreground">Scraping tech startup directories and HR networks in realtime.</p>
                  </div>
                </div>
              ) : scrapedJobs.length === 0 ? (
                <div className="text-center py-20 space-y-4 bg-card/5 border border-dashed border-white/5 rounded-2xl">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">No active matches found</p>
                    <p className="text-xs text-muted-foreground">Try broadening your search term or search for "React", "Postgres", or "Vercel".</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {scrapedJobs.map((job) => (
                    <div key={job.id} className="bg-card/20 border border-white/5 hover:border-accent/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-all space-y-4 hover:translate-y-[-1px]">
                      {/* Match Score Badge */}
                      <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-gradient-to-r from-accent/20 to-[#FF3366]/20 border border-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-accent/5">
                        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                        <span>{job.matchScore}% Match</span>
                      </div>

                      {/* Job Header */}
                      <div className="space-y-1.5 pr-32">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent">{job.companyName}</span>
                        <h3 className="text-lg font-bold text-white">{job.roleTitle}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{job.location}</span>
                          </span>
                          {job.salaryRange && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-400">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{job.salaryRange}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Job Description */}
                      <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                        {job.description}
                      </p>

                      {/* Recruiters List */}
                      {job.recruiters && job.recruiters.length > 0 && (
                        <div className="border-t border-white/5 pt-4 space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-accent" />
                            <span>Target HR Contacts (Identified via Crawler)</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {job.recruiters.map((rec: any, idx: number) => (
                              <div key={idx} className="bg-card/45 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-white/10 transition-all">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-white truncate">{rec.name}</span>
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/10 font-bold uppercase">
                                      Verified
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate">{rec.role}</p>
                                  <p className="text-[10px] text-accent truncate">{rec.email}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {rec.linkedinUrl && (
                                    <a 
                                      href={rec.linkedinUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-white border border-white/5 hover:border-white/10 transition-all"
                                      title="LinkedIn Profile"
                                    >
                                      <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="border-t border-white/5 pt-4 flex justify-end">
                        <Button
                          disabled={importingJobId !== null}
                          onClick={() => handleImportJob(job)}
                          className="bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white shadow-lg shadow-primary/20 gap-2 px-6 h-10 hover:scale-[1.01] active:scale-[0.99] transition-all font-semibold"
                        >
                          {importingJobId === job.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          <span>Sync Job & Recruiter to CRM</span>
                        </Button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
