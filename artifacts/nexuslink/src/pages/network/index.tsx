import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Network, Search, Sparkles, ChevronRight, User,
  Activity, Copy, Info, GitBranch, LayoutGrid, SlidersHorizontal,
  ZoomIn, ZoomOut, Maximize2, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NetworkGraph, GraphNode, GraphEdge } from "./graph";
import { useListContacts } from "@workspace/api-client-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Demo seed data (replaced by real contacts when available) ────────────────
const DEMO_NODES: Omit<GraphNode, "x" | "y" | "vx" | "vy">[] = [
  {
    id: "you",
    name: "You",
    company: null,
    role: null,
    tags: [],
    relationshipType: "you",
    affinityScore: 100,
    lastContactedDaysAgo: null,
    connectedSince: null,
    interactionCount: 0,
    description: "Your network hub",
  },
  {
    id: "1",
    name: "Sarah Jenkins",
    company: "Vercel",
    role: "Engineering Manager",
    tags: ["warm-path", "tech"],
    relationshipType: "warm",
    affinityScore: 88,
    lastContactedDaysAgo: 7,
    connectedSince: "Jan 2024",
    interactionCount: 12,
    description: "Met at YC Demo Day S23. Introduced me to the Vercel hiring team.",
  },
  {
    id: "2",
    name: "Tuomas Artola",
    company: "Linear",
    role: "Co-Founder",
    tags: ["founder", "product"],
    relationshipType: "mentor",
    affinityScore: 92,
    lastContactedDaysAgo: 14,
    connectedSince: "Mar 2023",
    interactionCount: 22,
    description: "Connected via Replit community. Mentors me on product strategy monthly.",
  },
  {
    id: "3",
    name: "Priya Nair",
    company: "Sequoia Capital",
    role: "Associate",
    tags: ["vc", "investor"],
    relationshipType: "warm",
    affinityScore: 65,
    lastContactedDaysAgo: 32,
    connectedSince: "Jun 2024",
    interactionCount: 5,
    description: "Met via Tuomas intro. Expressed interest in our product category.",
  },
  {
    id: "4",
    name: "Daniel Kim",
    company: "Supabase",
    role: "Senior Developer Advocate",
    tags: ["devrel", "tech"],
    relationshipType: "peer",
    affinityScore: 78,
    lastContactedDaysAgo: 3,
    connectedSince: "Aug 2023",
    interactionCount: 34,
    description: "Active collaborator on open-source integrations. Shares leads and opportunities.",
  },
  {
    id: "5",
    name: "Emily Hart",
    company: "Google",
    role: "Talent Partner",
    tags: ["recruiter", "big-tech"],
    relationshipType: "recruiter",
    affinityScore: 72,
    lastContactedDaysAgo: 5,
    connectedSince: "Nov 2023",
    interactionCount: 8,
    description: "University recruiter turned hiring partner. First contact about internship roles.",
  },
  {
    id: "6",
    name: "Marcus Chen",
    company: "YCombinator",
    role: "Batch Partner W25",
    tags: ["founder", "startup"],
    relationshipType: "peer",
    affinityScore: 55,
    lastContactedDaysAgo: 18,
    connectedSince: "Apr 2025",
    interactionCount: 4,
    description: "Connected during YC W25 batch networking sessions. Working on complementary tooling.",
  },
  {
    id: "7",
    name: "Aisha Okoye",
    company: "Stripe",
    role: "Product Manager",
    tags: ["fintech", "pm"],
    relationshipType: "warm",
    affinityScore: 83,
    lastContactedDaysAgo: 10,
    connectedSince: "Feb 2024",
    interactionCount: 15,
    description: "Worked together on a hackathon project. Shares feedback on product decisions.",
  },
  {
    id: "8",
    name: "Ravi Sharma",
    company: "OpenAI",
    role: "Research Scientist",
    tags: ["ai", "research"],
    relationshipType: "cold",
    affinityScore: 30,
    lastContactedDaysAgo: 65,
    connectedSince: "Dec 2023",
    interactionCount: 2,
    description: "Met at a conference. Haven't followed up — should reconnect soon.",
  },
  {
    id: "9",
    name: "Linda Zhao",
    company: "Figma",
    role: "Design Lead",
    tags: ["design", "product"],
    relationshipType: "peer",
    affinityScore: 68,
    lastContactedDaysAgo: 21,
    connectedSince: "Sep 2023",
    interactionCount: 9,
    description: "Collaboration on design system research. Shared resources and tooling.",
  },
];

const DEMO_EDGES: GraphEdge[] = [
  { source: "you", target: "1", strength: 0.88 },
  { source: "you", target: "2", strength: 0.92 },
  { source: "you", target: "4", strength: 0.78 },
  { source: "you", target: "5", strength: 0.72 },
  { source: "you", target: "7", strength: 0.83 },
  { source: "you", target: "8", strength: 0.30 },
  { source: "you", target: "9", strength: 0.68 },
  { source: "1", target: "3", strength: 0.6 },  // Sarah → Priya
  { source: "2", target: "3", strength: 0.5 },  // Tuomas → Priya
  { source: "2", target: "6", strength: 0.4 },  // Tuomas → Marcus
  { source: "1", target: "4", strength: 0.55 }, // Sarah → Daniel
  { source: "4", target: "7", strength: 0.5 },  // Daniel → Aisha
  { source: "7", target: "3", strength: 0.35 }, // Aisha → Priya
  { source: "you", target: "6", strength: 0.55 },
  { source: "5", target: "1", strength: 0.4 },  // Emily → Sarah
  { source: "8", target: "9", strength: 0.3 },  // Ravi → Linda
];

// ─── Filter types ────────────────────────────────────────────────────────────
type FilterType = "all" | GraphNode["relationshipType"];

const FILTER_OPTIONS: { value: FilterType; label: string; color: string }[] = [
  { value: "all", label: "All", color: "#6366f1" },
  { value: "warm", label: "Warm", color: "#22d3ee" },
  { value: "mentor", label: "Mentors", color: "#f59e0b" },
  { value: "recruiter", label: "Recruiters", color: "#10b981" },
  { value: "peer", label: "Peers", color: "#6366f1" },
  { value: "cold", label: "Cold", color: "#64748b" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WarmPathsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"graph" | "paths">("graph");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<WarmPath[]>([]);
  const [searched, setSearched] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [graphKey, setGraphKey] = useState(0);

  const [generatingHookId, setGeneratingHookId] = useState<string | null>(null);
  const [hooks, setHooks] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ width: 900, height: 540 });

  // Responsive graph sizing
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setGraphSize({ width: w, height: Math.min(Math.max(w * 0.56, 380), 600) });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Filter nodes / edges based on selected type
  const filteredNodes: GraphNode[] = DEMO_NODES
    .filter(n => filterType === "all" || n.relationshipType === "you" || n.relationshipType === filterType)
    .map(n => ({ ...n, x: 0, y: 0, vx: 0, vy: 0 }));

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = DEMO_EDGES.filter(
    e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Warm-paths search
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
          targetRole: target.role || "representative",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHooks(prev => ({ ...prev, [key]: data.hook }));
        toast({ title: "Warm Intro Hook Generated!", description: "Forwardable template is ready to copy." });
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
    toast({ title: "Hook Copied!", description: "Paste it directly into Slack, LinkedIn or email." });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const networkStats = {
    total: DEMO_NODES.filter(n => n.id !== "you").length,
    warm: DEMO_NODES.filter(n => n.relationshipType === "warm").length,
    mentors: DEMO_NODES.filter(n => n.relationshipType === "mentor").length,
    cold: DEMO_NODES.filter(n => n.relationshipType === "cold").length,
    avgAffinity: Math.round(
      DEMO_NODES.filter(n => n.id !== "you").reduce((a, n) => a + n.affinityScore, 0) /
      DEMO_NODES.filter(n => n.id !== "you").length
    ),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
          <Network className="w-8 h-8 text-primary shrink-0" />
          <span>Network Intelligence</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize your entire relationship graph and discover warm introduction paths.
        </p>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Contacts", value: networkStats.total, color: "text-primary" },
          { label: "Warm Contacts", value: networkStats.warm, color: "text-cyan-400" },
          { label: "Mentors", value: networkStats.mentors, color: "text-amber-400" },
          { label: "Cold Contacts", value: networkStats.cold, color: "text-slate-400" },
          { label: "Avg Affinity", value: `${networkStats.avgAffinity}%`, color: "text-emerald-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-card/20 border border-white/5 rounded-xl p-3 text-center">
            <div className={`text-2xl font-display font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center gap-1 bg-card/30 border border-white/5 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("graph")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "graph" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Network Graph
        </button>
        <button
          onClick={() => setTab("paths")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "paths" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          Warm Path Finder
        </button>
      </div>

      {/* ── GRAPH TAB ────────────────────────────────────────────────────────── */}
      {tab === "graph" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              {FILTER_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => { setFilterType(f.value); setGraphKey(k => k + 1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    filterType === f.value
                      ? "text-white border-transparent"
                      : "text-muted-foreground border-white/10 hover:border-white/20"
                  }`}
                  style={filterType === f.value ? { background: f.color + "33", borderColor: f.color + "66", color: f.color } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setGraphKey(k => k + 1)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-layout
            </button>
          </div>

          {/* Canvas container */}
          <div
            ref={containerRef}
            className="w-full rounded-2xl border border-white/5 overflow-hidden shadow-2xl"
          >
            <NetworkGraph
              key={graphKey}
              nodes={filteredNodes}
              edges={filteredEdges}
              width={graphSize.width}
              height={graphSize.height}
            />
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            <span className="font-medium text-white">{filteredNodes.length - 1}</span> contacts visible ·
            Node size = affinity · Edge thickness = interaction frequency ·
            <span className="text-primary"> Drag nodes</span> to rearrange ·
            <span className="text-primary"> Click</span> to pin details
          </p>
        </div>
      )}

      {/* ── WARM PATHS TAB ───────────────────────────────────────────────────── */}
      {tab === "paths" && (
        <div className="space-y-8">
          {/* Search */}
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
                  onChange={e => setCompany(e.target.value)}
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

          {/* Results */}
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
                    No direct or 2nd-degree paths found to <span className="text-white font-bold">"{company}"</span>.
                    Try adding past company details to your contacts or checking VC introducers.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {paths.map((path, idx) => {
                    const key = `path_${idx}`;
                    const hasHook = !!hooks[key];
                    return (
                      <div key={idx} className="bg-card/25 border border-white/5 hover:border-primary/25 rounded-2xl p-6 shadow-2xl transition-all duration-200 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                              {path.degree}-Degree Connection
                            </span>
                            <p className="text-sm text-gray-300 font-medium">{path.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground font-medium block">Path Affinity Score</span>
                              <span className="text-xs font-bold text-muted-foreground">S(t) = 100 × e^(-0.05t)</span>
                            </div>
                            <div className={`border px-3 py-1.5 rounded-xl font-display font-extrabold text-lg text-center ${getScoreColor(path.score)}`}>
                              {path.score}
                            </div>
                          </div>
                        </div>

                        {/* Graph traversal viz */}
                        <div className="flex flex-wrap items-center gap-3 bg-secondary/20 p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-2 rounded-lg border border-white/5">
                            <User className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-white">You</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          {path.path.map((node, nIdx) => (
                            <div key={nIdx} className="flex items-center gap-2">
                              <div className="bg-[#141421] px-4 py-2.5 rounded-xl border border-white/10 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-white">{node.name}</span>
                                  <span className={`text-[10px] px-1.5 rounded border ${getScoreColor(node.relationshipScore)}`}>
                                    {node.relationshipScore} Affinity
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {node.role} {node.company ? `@ ${node.company}` : ""}
                                </div>
                                {node.lastContactedDaysAgo !== null && (
                                  <div className="text-[9px] text-gray-400">
                                    Last contacted: {node.lastContactedDaysAgo}d ago
                                  </div>
                                )}
                              </div>
                              {nIdx < path.path.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>

                        {/* AI Hook */}
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {!hasHook ? (
                            <Button
                              onClick={() => generateHook(idx, path)}
                              disabled={generatingHookId === key}
                              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 gap-2 shrink-0"
                            >
                              <Sparkles className="w-4 h-4" />
                              {generatingHookId === key ? "Consulting AI Coach..." : "Generate Intro Hook"}
                            </Button>
                          ) : (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex-1 space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                                <span>FORWARDABLE INTRO REQUEST</span>
                                <button onClick={() => copyHook(key)} className="hover:text-white flex items-center gap-1">
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-gray-200 leading-relaxed italic">"{hooks[key]}"</p>
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
      )}
    </div>
  );
}
