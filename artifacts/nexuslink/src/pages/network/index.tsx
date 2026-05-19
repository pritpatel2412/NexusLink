import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Network, Search, Sparkles, ChevronRight, User, 
  ArrowRight, Activity, Copy, Check, Info 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PathNode {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  relationshipScore: number;
  lastContactedDaysAgo: number | null;
}

interface WarmPath {
  degree: number;
  path: PathNode[];
  score: number;
  targetContact: string;
  company: string;
  description: string;
}

export default function WarmPathsPage() {
  const { toast } = useToast();
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<WarmPath[]>([]);
  const [searched, setSearched] = useState(false);

  // Hook generation
  const [generatingHookId, setGeneratingHookId] = useState<string | null>(null);
  const [hooks, setHooks] = useState<Record<string, string>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/network/paths?company=${encodeURIComponent(company)}`);
      if (res.ok) {
        const data = await res.json();
        setPaths(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateHook = async (pathIndex: number, path: WarmPath) => {
    const key = `path_${pathIndex}`;
    setGeneratingHookId(key);
    try {
      const connector = path.path[0];
      const target = path.path[path.path.length - 1];

      const res = await fetch("/api/network/intro-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: connector.name,
          targetName: target.name,
          targetCompany: path.company,
          targetRole: target.role || "representative"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHooks(prev => ({ ...prev, [key]: data.hook }));
        toast({
          title: "Warm Intro Hook Generated!",
          description: "Forwardable template is ready to copy."
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingHookId(null);
    }
  };

  const copyHook = (key: string) => {
    const hookText = hooks[key];
    if (!hookText) return;
    navigator.clipboard.writeText(hookText);
    toast({
      title: "Hook Copied!",
      description: "Paste it directly into Slack, LinkedIn or email."
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Premium Header */}
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
          <Network className="w-8 h-8 text-primary shrink-0" />
          <span>Warm Path Finder</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Stop cold messaging. Map dynamic, high-affinity connection paths to key startups, clients, and VCs.
        </p>
      </div>

      {/* Target Search Panel */}
      <div className="bg-card/20 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md max-w-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span>Enter Target Entity</span>
        </h2>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="e.g. Sequoia Capital, Supabase, Vercel" 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-secondary/40 border-white/10 pl-9"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading || !company}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg"
          >
            {loading ? "Searching Paths..." : "Find Paths"}
          </Button>
        </form>
      </div>

      {/* Results Workspace */}
      {searched && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Discovered Warm Connection Trails</span>
            <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {paths.length} Paths Found
            </span>
          </h2>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Calculating affinity vectors and graph hops...</div>
          ) : paths.length === 0 ? (
            <div className="bg-card/10 border border-dashed border-white/5 rounded-2xl p-12 text-center space-y-3">
              <Info className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                No direct or 2nd-degree paths found to <span className="text-white font-bold">"{company}"</span>. Try adding past company details to your contacts or checking VC introducers.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {paths.map((path, idx) => {
                const key = `path_${idx}`;
                const hasHook = !!hooks[key];

                return (
                  <div key={idx} className="bg-card/25 border border-white/5 hover:border-primary/25 rounded-2xl p-6 shadow-2xl transition-all duration-200 space-y-6">
                    {/* Path Metadata */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                          {path.degree}-Degree Connection
                        </span>
                        <p className="text-sm text-gray-300 font-medium">{path.description}</p>
                      </div>

                      {/* Path Score */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground font-medium block">Path Affinity Score</span>
                          <span className="text-xs font-bold text-muted-foreground">Decay math: S(t) = 100 * e^(-0.05 * t)</span>
                        </div>
                        <div className={`border px-3 py-1.5 rounded-xl font-display font-extrabold text-lg text-center ${getScoreColor(path.score)}`}>
                          {path.score}
                        </div>
                      </div>
                    </div>

                    {/* Graph Visual Traversal */}
                    <div className="flex flex-wrap items-center gap-3 bg-secondary/20 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 bg-secondary/80 px-3 py-2 rounded-lg border border-white/5">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-white">You</span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground" />

                      {path.path.map((node, nIdx) => (
                        <div key={nIdx} className="flex items-center gap-2">
                          <div className="bg-[#141421] px-4 py-2.5 rounded-xl border border-white/10 space-y-0.5 relative group">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white">{node.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${getScoreColor(node.relationshipScore)}`}>
                                {node.relationshipScore} Affinity
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-none">
                              {node.role} {node.company ? `@ ${node.company}` : ""}
                            </div>
                            {node.lastContactedDaysAgo !== null && (
                              <div className="text-[9px] text-gray-400 mt-1">
                                Last contacted: {node.lastContactedDaysAgo} days ago
                              </div>
                            )}
                          </div>
                          {nIdx < path.path.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>

                    {/* AI Hook Output */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {!hasHook ? (
                        <Button 
                          onClick={() => generateHook(idx, path)}
                          disabled={generatingHookId === key}
                          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 gap-2 shrink-0"
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>{generatingHookId === key ? "Consulting AI Coach..." : "Generate Intro Hook"}</span>
                        </Button>
                      ) : (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex-1 space-y-3 relative">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                            <span>FORWARDABLE INTRO REQUEST</span>
                            <button 
                              onClick={() => copyHook(key)} 
                              className="hover:text-white flex items-center gap-1 text-xs"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Forwardable Text</span>
                            </button>
                          </div>
                          <p className="text-sm text-gray-200 leading-relaxed italic">
                            "{hooks[key]}"
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
