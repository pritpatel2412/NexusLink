import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Loader2, Sparkles, Tag, CheckSquare, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredToken } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SummaryResult {
  keyPoints: string[];
  actionItems: string[];
  sentiment: "positive" | "neutral" | "negative";
  suggestedTags: string[];
  summary: string;
  interactionType: string;
}

const sentimentConfig = {
  positive: { label: "Positive", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  neutral: { label: "Neutral", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  negative: { label: "Needs Attention", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

export function SmartSummarizer({ contactId, onActionItems }: {
  contactId?: string;
  onActionItems?: (items: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const token = getStoredToken();
      const res = await window.fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, contactId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch {
      // silent error
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!result) return;
    const text = `Summary: ${result.summary}\n\nKey Points:\n${result.keyPoints.map(p => `• ${p}`).join("\n")}\n\nAction Items:\n${result.actionItems.map(a => `☐ ${a}`).join("\n")}\n\nTags: ${result.suggestedTags.join(", ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentimentCfg = result ? (sentimentConfig[result.sentiment] || sentimentConfig.neutral) : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 border-white/10 hover:border-primary/40 text-muted-foreground hover:text-white h-9 rounded-xl"
      >
        <Wand2 className="w-3.5 h-3.5" />
        <span className="text-sm">Smart Summarizer</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-xl bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden z-10"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Wand2 className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white">Smart Note Summarizer</h2>
                    <p className="text-xs text-muted-foreground">Paste raw notes or email threads</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {!result ? (
                  <>
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Paste your meeting notes, email thread, or any raw text here...

Example:
Had a great call with Sarah today. She mentioned her startup just raised a Series A. She's looking for a design partner. Wants to connect me with their CPO. Follow up next week. She prefers async Slack communication."
                      className="w-full h-40 bg-background/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                      disabled={loading}
                    />
                    <Button
                      onClick={analyze}
                      disabled={!text.trim() || loading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold gap-2 shadow-lg shadow-primary/20"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Extract Insights</>
                      )}
                    </Button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Summary</span>
                          {sentimentCfg && (
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", sentimentCfg.bg, sentimentCfg.color)}>
                              {sentimentCfg.label}
                            </span>
                          )}
                          {result.interactionType && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-muted-foreground capitalize">
                              {result.interactionType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">{result.summary}</p>
                      </div>
                    </div>

                    {result.keyPoints?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Key Points</p>
                        <div className="space-y-1.5">
                          {result.keyPoints.map((p, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                              <p className="text-sm text-gray-300">{p}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.actionItems?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Action Items</p>
                        <div className="space-y-1.5">
                          {result.actionItems.map((a, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300">{a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.suggestedTags?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Suggested Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {result.suggestedTags.map((tag, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-medium"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAll}
                        className="gap-2 border-white/10 hover:border-white/20 rounded-xl flex-1 h-9"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy All"}
                      </Button>
                      {result.actionItems?.length > 0 && onActionItems && (
                        <Button
                          size="sm"
                          onClick={() => { onActionItems(result.actionItems); setOpen(false); }}
                          className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl flex-1 h-9"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Add as Tasks
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setResult(null); setText(""); }}
                        className="rounded-xl h-9 px-4"
                      >
                        New
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
