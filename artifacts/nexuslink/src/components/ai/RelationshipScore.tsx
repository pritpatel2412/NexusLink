import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredToken } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ScoreData {
  score: number;
  label: "Thriving" | "Active" | "Warm" | "Cooling" | "At Risk" | "Dormant";
  trend: "improving" | "stable" | "declining";
  insights: string[];
  nextAction: string;
  bestTimeToReach?: string;
}

const labelConfig = {
  Thriving: { color: "text-emerald-400", bg: "bg-emerald-400", track: "stroke-emerald-400", ring: "border-emerald-400/30 bg-emerald-400/10" },
  Active: { color: "text-green-400", bg: "bg-green-400", track: "stroke-green-400", ring: "border-green-400/30 bg-green-400/10" },
  Warm: { color: "text-blue-400", bg: "bg-blue-400", track: "stroke-blue-400", ring: "border-blue-400/30 bg-blue-400/10" },
  Cooling: { color: "text-amber-400", bg: "bg-amber-400", track: "stroke-amber-400", ring: "border-amber-400/30 bg-amber-400/10" },
  "At Risk": { color: "text-orange-400", bg: "bg-orange-400", track: "stroke-orange-400", ring: "border-orange-400/30 bg-orange-400/10" },
  Dormant: { color: "text-red-400", bg: "bg-red-400", track: "stroke-red-400", ring: "border-red-400/30 bg-red-400/10" },
};

function ScoreGauge({ score, label }: { score: number; label: keyof typeof labelConfig }) {
  const cfg = labelConfig[label] || labelConfig["Warm"];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={cfg.track}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("text-2xl font-bold font-mono", cfg.color)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function RelationshipScore({ contactId }: { contactId: string }) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await window.fetch("/api/ai/relationship-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ contactId }),
      });
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Could not compute score");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [contactId]);

  const cfg = data ? (labelConfig[data.label] || labelConfig["Warm"]) : null;

  const TrendIcon = data?.trend === "improving" ? TrendingUp
    : data?.trend === "declining" ? TrendingDown
    : Minus;

  const trendColor = data?.trend === "improving" ? "text-green-400"
    : data?.trend === "declining" ? "text-red-400"
    : "text-muted-foreground";

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white text-sm">AI Relationship Score</h3>
            <p className="text-xs text-muted-foreground">Powered by GPT-4o</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="text-muted-foreground hover:text-white transition-colors">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Analyzing relationship...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={load} className="text-xs">Retry</Button>
        </div>
      ) : data ? (
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <ScoreGauge score={data.score} label={data.label as keyof typeof labelConfig} />
            <div className="space-y-2">
              <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", cfg?.ring)}>
                <span className={cn("w-2 h-2 rounded-full", cfg?.bg)} />
                <span className={cfg?.color}>{data.label}</span>
              </div>
              <div className={cn("flex items-center gap-1.5 text-xs", trendColor)}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span className="capitalize">{data.trend}</span>
              </div>
              {data.bestTimeToReach && (
                <p className="text-xs text-muted-foreground">{data.bestTimeToReach}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-white/70 uppercase tracking-wider">AI Insights</p>
            {data.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>

          {data.nextAction && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/8 border border-primary/20"
            >
              <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white mb-0.5">Recommended Next Action</p>
                <p className="text-xs text-primary/90">{data.nextAction}</p>
              </div>
            </motion.div>
          )}
        </div>
      ) : null}
    </div>
  );
}
