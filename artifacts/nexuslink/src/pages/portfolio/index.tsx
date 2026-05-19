import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, Plus, Github, ExternalLink, Trash2, 
  Sparkles, Copy, Check, FileText, Monitor, Video, ShieldAlert 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkArtifact {
  id: string;
  title: string;
  description: string | null;
  type: string;
  artifactUrl: string;
  metrics: string | null;
  skills: string | null;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [artifacts, setArtifacts] = useState<WorkArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("github");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [metrics, setMetrics] = useState("");
  const [skills, setSkills] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Pitch Generator State
  const [selectedArtifactId, setSelectedArtifactId] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetStack, setTargetStack] = useState("");
  const [generatedPitch, setGeneratedPitch] = useState("");
  const [pitchLoading, setPitchLoading] = useState(false);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        setArtifacts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artifactUrl) {
      toast({
        title: "Missing Fields",
        description: "Title and Artifact URL are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          artifactUrl,
          metrics,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        toast({
          title: "Artifact Added",
          description: "Proof of Work successfully loaded into your arsenal."
        });
        setTitle("");
        setDescription("");
        setArtifactUrl("");
        setMetrics("");
        setSkills("");
        setShowAddForm(false);
        fetchArtifacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this proof of work?")) return;
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Artifact Removed",
          description: "Artifact successfully removed from your portfolio."
        });
        fetchArtifacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyShareLink = () => {
    if (!user) return;
    const url = `${window.location.origin}/portfolio/public/${user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Anyone with this URL can view your targeted live portfolio."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePitch = async () => {
    if (!selectedArtifactId || !targetCompany) {
      toast({
        title: "Incomplete details",
        description: "Please select a project and target company to generate pitch.",
        variant: "destructive"
      });
      return;
    }

    setPitchLoading(true);
    setGeneratedPitch("");
    try {
      const artifact = artifacts.find(a => a.id === selectedArtifactId);
      const res = await fetch("/api/network/intro-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "Hiring Manager",
          targetName: "Engineering Team",
          targetCompany: targetCompany,
          targetRole: `using ${targetStack || "their tech stack"}. Selected project reference: ${artifact?.title}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPitch(data.hook);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPitchLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Proof of Work Arsenal
          </h1>
          <p className="text-muted-foreground mt-1">
            Replace generic resume formats with high-signal, interactive developer assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={copyShareLink}
            className="border-primary/20 hover:bg-primary/5 transition-all text-sm gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span>Share Portfolio Link</span>
          </Button>

          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 gap-2 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work Artifact</span>
          </Button>
        </div>
      </div>

      {/* Form Drawer (Glassmorphic) */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-card/20 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Configure Proof of Work Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Project Title</label>
              <Input 
                placeholder="e.g. Realtime WebRTC Collaboration Engine" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Artifact Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary/40 border border-white/10 text-sm focus:outline-none text-white"
              >
                <option value="github">GitHub Repository</option>
                <option value="figma">Figma Canvas</option>
                <option value="deploy">Live Deploy</option>
                <option value="video">Case Study Video</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Artifact URL</label>
            <Input 
              placeholder="e.g. https://github.com/alex/webrtc-collab" 
              value={artifactUrl} 
              onChange={(e) => setArtifactUrl(e.target.value)}
              className="bg-secondary/40 border-white/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Short Case Description (Problem Solved & Context)</label>
            <Textarea 
              placeholder="Explain what was broken, and how your architectural implementation fixed it."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/40 border-white/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Outcome Metrics (Comma Separated)</label>
              <Input 
                placeholder="e.g. +400% throughput, 99.9% uptime" 
                value={metrics} 
                onChange={(e) => setMetrics(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Skills Applied (Comma Separated)</label>
              <Input 
                placeholder="e.g. TypeScript, WebRTC, Redis" 
                value={skills} 
                onChange={(e) => setSkills(e.target.value)}
                className="bg-secondary/40 border-white/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
              Publish Card
            </Button>
            <Button variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Main Grid: Projects + AI Pitch Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Proof of Work list */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <span>Active Proof of Work Cards</span>
          </h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Arsenal...</div>
          ) : artifacts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-card/10">
              <p className="text-muted-foreground mb-4">No Proof of Work cards published yet.</p>
              <Button onClick={() => setShowAddForm(true)} variant="outline">Create Your First Card</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {artifacts.map((art) => (
                <div key={art.id} className="bg-card/20 border border-white/5 hover:border-primary/20 rounded-2xl p-5 shadow-lg relative flex flex-col justify-between hover:scale-[1.01] transition-all group">
                  <button 
                    onClick={() => handleDelete(art.id)} 
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {art.type === "github" && <Github className="w-5 h-5 text-gray-300" />}
                      {art.type === "figma" && <FileText className="w-5 h-5 text-pink-400" />}
                      {art.type === "deploy" && <Monitor className="w-5 h-5 text-green-400" />}
                      {art.type === "video" && <Video className="w-5 h-5 text-red-400" />}
                      <span className="font-bold text-white text-md tracking-tight">{art.title}</span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {art.description || "No description provided."}
                    </p>

                    {/* Outcome Metrics */}
                    {art.metrics && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {art.metrics.split(",").map((m, i) => (
                          <span key={i} className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10">
                            {m.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-1">
                      {art.skills && JSON.parse(art.skills).slice(0, 3).map((s: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-secondary/60 text-gray-300 px-2 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>

                    <a 
                      href={art.artifactUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary hover:text-accent font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Explore</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Context-Aware Pitch Generator */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#141421] to-[#0A0A0F] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background glowing ball */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span>AI Hook Generator</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Draft context-aware hooks highlighting your relevant work metrics to catch engineering leads.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Select Proof of Work Reference</label>
                <select 
                  value={selectedArtifactId}
                  onChange={(e) => setSelectedArtifactId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-secondary/40 border border-white/10 text-sm focus:outline-none text-white"
                >
                  <option value="">-- Choose project --</option>
                  {artifacts.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Target Company</label>
                <Input 
                  placeholder="e.g. Vercel, Supabase" 
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="bg-secondary/40 border-white/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Their Tech Stack / Problem Domain</label>
                <Input 
                  placeholder="e.g. Next.js, Edge Functions" 
                  value={targetStack}
                  onChange={(e) => setTargetStack(e.target.value)}
                  className="bg-secondary/40 border-white/10"
                />
              </div>

              <Button 
                onClick={generatePitch} 
                disabled={pitchLoading || !selectedArtifactId || !targetCompany}
                className="w-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 font-medium"
              >
                {pitchLoading ? "Analyzing & Drafting..." : "Generate 3-Line Hook"}
              </Button>
            </div>

            {/* AI Output Result */}
            {generatedPitch && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-primary font-bold">
                  <span>DRAFT HOOK</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPitch);
                      toast({ title: "Hook copied", description: "Ready to paste in your email or LinkedIn message!" });
                    }} 
                    className="hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-sm text-gray-200 italic leading-relaxed">
                  "{generatedPitch}"
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
