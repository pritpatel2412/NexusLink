import { Link } from "wouter";
import { MoreHorizontal, Mail, MapPin, Briefcase } from "lucide-react";
import type { Contact } from "@workspace/api-client-react";
import { getInitials, generateGradient, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Link href={`/contacts/${contact.id}`}>
      <div className="group bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(108,99,255,0.12)] transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden">
        {/* Subtle background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border border-white/10 shrink-0",
              generateGradient(contact.id)
            )}>
              {getInitials(contact.name)}
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{contact.name}</h3>
              {contact.role && contact.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[160px]">{contact.role} @ {contact.company}</span>
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 mt-auto relative z-10">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{contact.location}</span>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between relative z-10">
          <div className="flex flex-wrap gap-1.5">
            {contact.tags?.slice(0, 2).map((tag) => (
              <span key={tag.id} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                {tag.tag}
              </span>
            ))}
            {(contact.tags?.length || 0) > 2 && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                +{(contact.tags?.length || 0) - 2}
              </span>
            )}
          </div>
          {contact.lastInteractionAt && (
            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {formatDistanceToNow(new Date(contact.lastInteractionAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
