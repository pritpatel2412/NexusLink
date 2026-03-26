import { useState } from "react";
import { Link } from "wouter";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useListInteractions } from "@workspace/api-client-react";
import {
  Clock, Mail, Phone, Calendar, MessageSquare, FileText,
  Filter, Loader2, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials, generateGradient, cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  email:   { icon: Mail,          color: "text-primary",    bg: "bg-primary/10",    label: "Email" },
  call:    { icon: Phone,         color: "text-blue-400",   bg: "bg-blue-400/10",   label: "Call" },
  meeting: { icon: Calendar,      color: "text-emerald-400",bg: "bg-emerald-400/10",label: "Meeting" },
  note:    { icon: FileText,      color: "text-amber-400",  bg: "bg-amber-400/10",  label: "Note" },
  message: { icon: MessageSquare, color: "text-violet-400", bg: "bg-violet-400/10", label: "Message" },
};

const TYPES = ["all", "email", "call", "meeting", "note", "message"];

function groupByDate(interactions: any[]) {
  const groups: Record<string, any[]> = {};
  for (const item of interactions) {
    const d = new Date(item.occurredAt);
    let label: string;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "MMMM d, yyyy");
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}

export default function TimelinePage() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: interactions, isLoading } = useListInteractions(
    typeFilter !== "all" ? { type: typeFilter } : {},
    { query: { staleTime: 30_000 } }
  );

  const grouped = groupByDate(interactions || []);
  const dateGroups = Object.entries(grouped);

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Timeline</h1>
          <p className="text-muted-foreground mt-1">Your full interaction history across all contacts.</p>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
              typeFilter === t
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-card border border-border/50 text-muted-foreground hover:text-white hover:border-border"
            )}
          >
            {t === "all" ? "All" : TYPE_CONFIG[t]?.label || t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : dateGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-xl text-white mb-2">No interactions yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Log your first interaction from a contact's profile page.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {dateGroups.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wider">{date}</h2>
                <div className="flex-1 border-t border-border/40" />
                <span className="text-xs text-muted-foreground">{items.length} event{items.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-border/50">
                {items.map((item) => {
                  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
                  const Icon = cfg.icon;
                  return (
                    <div key={item.id} className="relative">
                      <div className={cn("absolute -left-[21px] p-1.5 rounded-full border border-border shadow-sm bg-card", cfg.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                      </div>
                      <div className="pl-5 pb-1">
                        <div className="bg-card border border-border/50 rounded-2xl p-4 hover:border-border transition-colors group">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                                {cfg.label}
                              </span>
                              {item.contactName && (
                                <Link href={`/contacts/${item.contactId}`}>
                                  <span className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
                                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0", generateGradient(item.contactId))}>
                                      {getInitials(item.contactName)}
                                    </div>
                                    {item.contactName}
                                  </span>
                                </Link>
                              )}
                            </div>
                            <time className="text-xs text-muted-foreground shrink-0 font-mono">
                              {format(new Date(item.occurredAt), "h:mm a")}
                            </time>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{item.summary}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                              via {item.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
