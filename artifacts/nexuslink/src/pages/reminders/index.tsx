import { useState } from "react";
import { Link } from "wouter";
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListReminders, useCreateReminder, useDeleteReminder,
  useListContacts, getListRemindersQueryKey
} from "@workspace/api-client-react";
import { Bell, Plus, Loader2, Trash2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

function getTimeBadge(remindAt: string | Date) {
  const d = new Date(remindAt);
  if (isPast(d) && !isToday(d)) return { label: "Overdue", cls: "text-rose-400 bg-rose-400/10" };
  if (isToday(d)) return { label: "Today", cls: "text-amber-400 bg-amber-400/10" };
  if (isTomorrow(d)) return { label: "Tomorrow", cls: "text-emerald-400 bg-emerald-400/10" };
  return { label: format(d, "MMM d"), cls: "text-muted-foreground bg-white/5" };
}

function CreateReminderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [contactId, setContactId] = useState("none");

  const { data: contacts } = useListContacts({});
  const { mutateAsync: createReminder, isPending } = useCreateReminder();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !remindAt) return;
    try {
      await createReminder({
        data: {
          message: message.trim(),
          remindAt,
          contactId: contactId !== "none" ? contactId : undefined,
        }
      });
      qc.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      toast({ title: "Reminder set!" });
      setMessage(""); setRemindAt(""); setContactId("none");
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to set reminder" });
    }
  }

  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New Reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Message *</label>
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Check in with Sarah about the proposal"
              className="bg-background/50 border-white/10"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">When *</label>
            <Input
              type="datetime-local"
              value={remindAt}
              onChange={e => setRemindAt(e.target.value)}
              min={minDate}
              className="bg-background/50 border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Link to Contact</label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 max-h-48 overflow-y-auto">
                <SelectItem value="none">None</SelectItem>
                {contacts?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 bg-transparent">Cancel</Button>
            <Button type="submit" disabled={isPending || !message.trim() || !remindAt} className="bg-primary hover:bg-primary/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RemindersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: reminders, isLoading } = useListReminders(
    {},
    { query: { staleTime: 30_000 } }
  );

  const { mutateAsync: deleteReminder } = useDeleteReminder();

  async function handleDelete(id: string) {
    try {
      await deleteReminder({ id });
      qc.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      toast({ title: "Reminder deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete reminder" });
    }
  }

  const upcoming = reminders?.filter(r => !isPast(new Date(r.remindAt)) || isToday(new Date(r.remindAt))) || [];
  const past = reminders?.filter(r => isPast(new Date(r.remindAt)) && !isToday(new Date(r.remindAt))) || [];

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Reminders</h1>
          <p className="text-muted-foreground mt-1">Never miss an important follow-up.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Reminder
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (reminders?.length || 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-xl text-white mb-2">No reminders yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Set reminders to never forget a follow-up.</p>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Set First Reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(reminder => {
                  const badge = getTimeBadge(reminder.remindAt);
                  return (
                    <div key={reminder.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-start gap-4 group hover:border-border transition-colors">
                      <div className="mt-0.5 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white leading-tight mb-1">{reminder.message}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badge.cls)}>
                            {badge.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <Clock className="w-3 h-3" />
                            {format(new Date(reminder.remindAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {reminder.contactName && (
                            <Link href={`/contacts/${reminder.contactId}`}>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer">
                                <User className="w-3 h-3" />
                                {reminder.contactName}
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400 mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-white/50 text-sm uppercase tracking-wider mb-4">Past</h2>
              <div className="space-y-3 opacity-50">
                {past.map(reminder => (
                  <div key={reminder.id} className="bg-card border border-border/30 rounded-2xl p-4 flex items-start gap-4 group">
                    <div className="mt-0.5 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-muted-foreground leading-tight mb-1 line-through">{reminder.message}</p>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(reminder.remindAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400 mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateReminderDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
