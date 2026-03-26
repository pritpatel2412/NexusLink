import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, Zap, RefreshCw, ArrowRight, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredToken } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface PriorityContact {
  id: string;
  name: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  suggestedAction: string;
}

interface Alert {
  name: string;
  message: string;
  severity: "warning" | "critical";
}

interface Opportunity {
  title: string;
  description: string;
}

interface PulseData {
  priorityContacts: PriorityContact[];
  alerts: Alert[];
  opportunities: Opportunity[];
  summary: string;
}

const urgencyColors = {
  high: { dot: "bg-red-400", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
  medium: { dot: "bg-amber-400", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  low: { dot: "bg-green-400", badge: "bg-green-500/10 text-green-400 border-green-500/20" },
};

export function NetworkPulsePanel({ onContactSelect }: { onContactSelect?: (name: string, action: string) => void }) {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"reach-out" | "alerts" | "opportunities">("reach-out");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await window.fetch("/api/ai/network-pulse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to load network pulse");
      const data = await res.json();
      setPulse(data);
    } catch (err: any) {
      setError("Could not load network insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const tabs = [
    { id: "reach-out", label: "Reach Out", count: pulse?.priorityContacts?.length || 0, icon: Zap },
    { id: "alerts", label: "Alerts", count: pulse?.alerts?.length || 0, icon: AlertTriangle },
    { id: "opportunities", label: "Insights", count: pulse?.opportunities?.length || 0, icon: TrendingUp },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-white text-sm">Network Pulse</h3>
          </div>
          <button
            onClick={fetch}
            disabled={loading}
            className="text-muted-foreground hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
        {pulse?.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed">{pulse.summary}</p>
        )}
      </div>

      <div className="flex border-b border-border/50 px-3 pt-2 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg border-b-2 transition-colors font-medium",
              tab === t.id
                ? "border-primary text-white bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                tab === t.id ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <p className="text-xs text-muted-foreground text-center">Analyzing your network...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetch} className="mt-2 text-xs">Retry</Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === "reach-out" && (
              <motion.div
                key="reach-out"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {!pulse?.priorityContacts?.length ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Add contacts to get AI reach-out suggestions.</p>
                ) : pulse.priorityContacts.map((c, i) => (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-3 rounded-xl bg-card/50 border border-border/40 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => onContactSelect?.(c.name, c.suggestedAction)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", urgencyColors[c.urgency]?.dot || "bg-primary")} />
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border capitalize shrink-0",
                        urgencyColors[c.urgency]?.badge || "bg-primary/10 text-primary border-primary/20"
                      )}>
                        {c.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed pl-4">{c.reason}</p>
                    <div className="flex items-center gap-1.5 pl-4">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      <p className="text-xs text-primary/90 font-medium">{c.suggestedAction}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {tab === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {!pulse?.alerts?.length ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg">✓</span>
                    </div>
                    <p className="text-xs text-muted-foreground">No relationship alerts — your network is healthy!</p>
                  </div>
                ) : pulse.alerts.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-3 rounded-xl border",
                      a.severity === "critical"
                        ? "bg-red-500/5 border-red-500/25"
                        : "bg-amber-500/5 border-amber-500/25"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        a.severity === "critical" ? "text-red-400" : "text-amber-400"
                      )} />
                      <span className="text-sm font-semibold text-white">{a.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-5">{a.message}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {tab === "opportunities" && (
              <motion.div
                key="opportunities"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {!pulse?.opportunities?.length ? (
                  <p className="text-xs text-muted-foreground text-center py-8">More interactions needed to surface network opportunities.</p>
                ) : pulse.opportunities.map((o, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-white">{o.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-5">{o.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="p-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground/60 text-center flex items-center justify-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Powered by GPT-4o · Updates on refresh
        </p>
      </div>
    </div>
  );
}
