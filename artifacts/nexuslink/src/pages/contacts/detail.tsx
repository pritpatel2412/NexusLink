import { useState } from "react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { useGetContact } from "@workspace/api-client-react";
import { 
  ArrowLeft, Edit, Mail, MapPin, Briefcase, Phone, Plus, 
  MessageSquare, Calendar, Sparkles, CheckSquare, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials, generateGradient, cn } from "@/lib/utils";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: contact, isLoading } = useGetContact(id);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!contact) {
    return <div className="p-8 text-center text-muted-foreground">Contact not found.</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Breadcrumb */}
      <div className="px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur shrink-0">
        <Link href="/contacts" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-6 relative z-10">
              <div className={cn(
                "w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-background",
                generateGradient(contact.id)
              )}>
                {getInitials(contact.name)}
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">{contact.name}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                  {contact.role && contact.company && (
                    <span className="flex items-center gap-1.5 text-gray-300 font-medium"><Briefcase className="w-4 h-4" /> {contact.role} @ {contact.company}</span>
                  )}
                  {contact.location && (
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {contact.location}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {contact.tags?.map(tag => (
                    <span key={tag.id} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white shadow-sm">
                      {tag.tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 relative z-10 w-full md:w-auto">
              <Button className="flex-1 md:w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Log Interaction
              </Button>
              <Button variant="outline" className="flex-1 md:w-full bg-transparent border-white/10 hover:bg-white/5">
                <Sparkles className="w-4 h-4 mr-2 text-accent" /> Get AI Brief
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left: Interaction Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
                  <h2 className="font-display text-xl font-semibold text-white">History</h2>
                  <Button variant="ghost" size="sm" className="text-primary"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                </div>
                
                <div className="space-y-8 pl-4 border-l-2 border-border/50 relative">
                  {contact.interactions?.length === 0 ? (
                    <p className="text-muted-foreground -ml-4 pl-8 py-4">No interactions logged yet.</p>
                  ) : (
                    contact.interactions?.map((interaction) => (
                      <div key={interaction.id} className="relative">
                        {/* Timeline node */}
                        <div className="absolute -left-[21px] p-1.5 bg-card rounded-full border border-border shadow-sm">
                          {interaction.type === 'meeting' ? <Calendar className="w-4 h-4 text-emerald-400" /> : 
                           interaction.type === 'call' ? <Phone className="w-4 h-4 text-blue-400" /> : 
                           <Mail className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="pl-6">
                          <div className="bg-secondary/40 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-white capitalize">{interaction.type}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(interaction.occurredAt), "MMM d, yyyy")}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{interaction.summary}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-muted-foreground border border-white/5">
                                Source: {interaction.source}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebars */}
            <div className="space-y-6">
              
              {/* Contact Info Panel */}
              <div className="bg-card border border-border/50 rounded-3xl p-6">
                <h3 className="font-display font-semibold text-white mb-4">Contact Info</h3>
                <div className="space-y-4 text-sm">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-gray-300 break-all">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-gray-300">{contact.phone}</span>
                    </div>
                  )}
                  {contact.whereMet && (
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Where We Met</p>
                      <p className="text-gray-300">{contact.whereMet}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Panel */}
              <div className="bg-card border border-border/50 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-semibold text-white">Open Tasks</h3>
                  <Button variant="ghost" size="icon" className="w-6 h-6"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-3">
                  {contact.tasks?.filter(t => t.status === 'pending').map(task => (
                    <div key={task.id} className="flex gap-3 items-start border border-white/5 bg-secondary/20 p-3 rounded-xl">
                      <div className="mt-0.5 w-4 h-4 rounded-full border border-muted-foreground shrink-0 cursor-pointer" />
                      <div>
                        <p className="text-sm font-medium text-white leading-tight mb-1">{task.title}</p>
                        {task.dueDate && <p className="text-xs text-amber-500 font-mono">{format(new Date(task.dueDate), "MMM d")}</p>}
                      </div>
                    </div>
                  ))}
                  {(!contact.tasks || contact.tasks.filter(t => t.status === 'pending').length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">No open tasks.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Temporary internal simple filter icon placeholder
function Filter({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
