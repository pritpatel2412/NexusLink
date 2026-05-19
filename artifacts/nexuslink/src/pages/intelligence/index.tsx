import { useState, useEffect } from "react";
import { 
  BrainCircuit, Activity, TrendingUp, AlertCircle, 
  MessageSquare, User, Zap, Star, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface RHSContact {
  contactId: string;
  name: string;
  company: string | null;
  role: string | null;
  rhs: number;
  status: "healthy" | "warm" | "cooling" | "cold";
  suggestion: string;
}

interface BriefingRec {
  contactId: string;
  name: string;
  company: string | null;
  role: string | null;
  rhs: number;
  reason: string;
  draftMessage: string;
  priority: "high" | "medium" | "low";
}

interface Signal {
  id: string;
  contactName: string;
  contactCompany: string | null;
  type: string;
  label: string;
  message: string;
  daysAgo: number;
}

export default function IntelligenceHub() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<{ networkHealth: number; contacts: RHSContact[] } | null>(null);
  const [briefing, setBriefing] = useState<{ recommendations: BriefingRec[]; summary: string } | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [mutuals, setMutuals] = useState<{ clusters: any[] }>({ clusters: [] });
  const [heatmap, setHeatmap] = useState<{ activeDays: number, longestStreak: number }>({ activeDays: 0, longestStreak: 0 });
  const [diversity, setDiversity] = useState<{ overallScore: number, roleDistribution: Record<string, number> }>({ overallScore: 0, roleDistribution: {} });

  useEffect(() => {
    async function fetchIntel() {
      try {
        const token = localStorage.getItem("nexuslink_token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const [rhsRes, briefingRes, signalsRes, mutualsRes, heatmapRes, divRes] = await Promise.all([
          fetch("/api/intelligence/rhs", { headers }),
          fetch("/api/intelligence/daily-briefing", { headers }),
          fetch("/api/intelligence/signals", { headers }),
          fetch("/api/intelligence/mutual", { headers }),
          fetch("/api/intelligence/heatmap", { headers }),
          fetch("/api/intelligence/diversity", { headers })
        ]);

        if (rhsRes.ok) setHealthData(await rhsRes.json());
        if (briefingRes.ok) setBriefing(await briefingRes.json());
        if (signalsRes.ok) setSignals(await signalsRes.json());
        if (mutualsRes.ok) setMutuals(await mutualsRes.json());
        if (heatmapRes.ok) setHeatmap(await heatmapRes.json());
        if (divRes.ok) setDiversity(await divRes.json());
      } catch (error) {
        console.error("Failed to fetch intelligence data", error);
        toast({ title: "Error", description: "Failed to load intelligence data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchIntel();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "warm": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "cooling": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "cold": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Message copied to clipboard." });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Analyzing network intelligence...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6 flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <BrainCircuit className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">
            Intelligence Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-driven insights to maximize your network's ROI.
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card/20 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Network Health Score</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-display font-extrabold text-white">
                {healthData?.networkHealth || 0}
              </span>
              <span className="text-lg text-muted-foreground mb-1">/100</span>
            </div>
          </div>
          <Activity className="w-12 h-12 text-primary opacity-20" />
        </div>
        
        <div className="bg-card/20 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md">
           <p className="text-sm text-muted-foreground font-medium mb-2">Daily Briefing Summary</p>
           <p className="text-sm text-gray-300 line-clamp-2">{briefing?.summary || "No active recommendations."}</p>
        </div>

        <div className="bg-card/20 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md">
           <p className="text-sm text-muted-foreground font-medium mb-2">Active Signals</p>
           <div className="flex items-center gap-3">
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
                {signals.length} Updates
              </div>
              <span className="text-xs text-muted-foreground">in the last 14 days</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Briefing & Signals */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Daily Briefing */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Who to Contact Today
            </h2>
            <div className="space-y-4">
              {briefing?.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-card/30 border border-white/10 rounded-xl p-5 hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">{rec.name}</h3>
                      <p className="text-xs text-muted-foreground">{rec.role} @ {rec.company}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider mb-1 ${
                        rec.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] text-muted-foreground">{rec.reason}</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 border border-white/5 rounded-lg p-4 relative group-hover:border-white/10 transition-colors">
                    <p className="text-sm text-gray-300 italic">"{rec.draftMessage}"</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute top-2 right-2 h-7 px-2 bg-white/5 hover:bg-white/10 text-xs"
                      onClick={() => copyToClipboard(rec.draftMessage)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              ))}
              {!briefing?.recommendations.length && (
                <div className="text-center py-8 text-muted-foreground bg-card/10 rounded-xl border border-dashed border-white/10">
                  You're all caught up for today!
                </div>
              )}
            </div>
          </section>

          {/* Signal Tracker */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Contact Signals
            </h2>
            <div className="space-y-3">
              {signals.map((sig) => (
                <div key={sig.id} className="flex items-start gap-4 bg-card/20 border border-white/5 p-4 rounded-xl">
                  <div className="p-2 bg-white/5 rounded-lg shrink-0 mt-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{sig.contactName}</span>
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">{sig.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{sig.daysAgo}d ago</span>
                    </div>
                    <p className="text-xs text-gray-400">{sig.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: RHS Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-400" />
            Relationship Health
          </h2>
          
          <div className="bg-card/20 border border-white/5 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Needs Attention</h3>
            <div className="space-y-3">
              {healthData?.contacts.filter(c => c.rhs < 50).slice(0, 5).map(c => (
                <div key={c.contactId} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{c.role} @ {c.company}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusColor(c.status)}`}>
                    {c.rhs}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/20 border border-white/5 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Strongest Ties</h3>
            <div className="space-y-3">
              {healthData?.contacts.filter(c => c.rhs >= 75).reverse().slice(0, 5).map(c => (
                <div key={c.contactId} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{c.role} @ {c.company}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusColor(c.status)}`}>
                    {c.rhs}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Stats (Heatmap & Diversity) */}
          <div className="bg-card/20 border border-white/5 rounded-xl p-5 space-y-4">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Network Vitality</h3>
             <div className="flex justify-between items-center pb-3 border-b border-white/5">
               <span className="text-sm text-gray-300">Active Days (Last 30)</span>
               <span className="font-bold text-white">{heatmap.activeDays}</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-white/5">
               <span className="text-sm text-gray-300">Longest Streak</span>
               <span className="font-bold text-emerald-400">{heatmap.longestStreak} days</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-gray-300">Diversity Score</span>
               <span className="font-bold text-purple-400">{diversity.overallScore}/100</span>
             </div>
          </div>

        </div>
      </div>

      {/* Mutual Connections / Hidden Clusters */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Hidden Network Clusters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mutuals.clusters.map((cluster, idx) => (
            <div key={idx} className="bg-card/20 border border-white/5 p-5 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-2">{cluster.company}</h3>
              <p className="text-xs text-muted-foreground mb-4">You have {cluster.count} connections here.</p>
              <div className="flex flex-wrap gap-2">
                {cluster.contacts.slice(0, 5).map((c: any) => (
                  <span key={c.id} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                    {c.name}
                  </span>
                ))}
                {cluster.contacts.length > 5 && (
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-400">
                    +{cluster.contacts.length - 5} more
                  </span>
                )}
              </div>
            </div>
          ))}
          {!mutuals.clusters.length && (
            <div className="col-span-full text-center py-8 text-muted-foreground bg-card/10 rounded-xl border border-dashed border-white/10">
              No significant clusters found yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
