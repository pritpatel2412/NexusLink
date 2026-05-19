import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateContact, getListContactsQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const RELATIONSHIP_OPTIONS = ["colleague", "client", "investor", "mentor", "friend", "lead", "partner", "vendor", "other"];

export default function NewContactPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [whereMet, setWhereMet] = useState("");
  const [notes, setNotes] = useState("");
  const [relationship, setRelationship] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { mutateAsync: createContact, isPending } = useCreateContact();

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Name is required" });
      return;
    }
    try {
      const contact = await createContact({
        data: {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          role: role.trim() || undefined,
          location: location.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          website: website.trim() || undefined,
          whereMet: whereMet.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: ([...tags, ...(relationship ? [relationship] : [])].length > 0 
            ? [...tags, ...(relationship ? [relationship] : [])] 
            : undefined) as any,
        }
      });
      qc.invalidateQueries({ queryKey: getListContactsQueryKey() });
      toast({ title: "Contact created!" });
      navigate(`/contacts/${(contact as any).id}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to create contact", description: err.message });
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur shrink-0 flex items-center justify-between">
        <Link href="/contacts" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white tracking-tight">Add New Contact</h1>
            <p className="text-muted-foreground mt-1">Build your network one person at a time.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6">
              <h2 className="font-display font-semibold text-white mb-5 text-lg">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className="bg-background/50 border-white/10 h-11" autoFocus />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="bg-background/50 border-white/10 h-11" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-background/50 border-white/10 h-11" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                    <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" className="bg-background/50 border-white/10 h-11" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role / Title</label>
                    <Input value={role} onChange={e => setRole(e.target.value)} placeholder="CEO" className="bg-background/50 border-white/10 h-11" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco, CA" className="bg-background/50 border-white/10 h-11" />
                </div>
              </div>
            </div>

            {/* Online Presence Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6">
              <h2 className="font-display font-semibold text-white mb-5 text-lg">Online Presence</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                  <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/janesmith" className="bg-background/50 border-white/10 h-11" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                  <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://janesmith.com" className="bg-background/50 border-white/10 h-11" />
                </div>
              </div>
            </div>

            {/* Relationship Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6">
              <h2 className="font-display font-semibold text-white mb-5 text-lg">Relationship</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Relationship Type</label>
                  <div className="flex flex-wrap gap-2">
                    {RELATIONSHIP_OPTIONS.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRelationship(relationship === r ? "" : r)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
                          relationship === r
                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                            : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Where We Met</label>
                  <Input value={whereMet} onChange={e => setWhereMet(e.target.value)} placeholder="e.g. TechCrunch Disrupt 2024" className="bg-background/50 border-white/10 h-11" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Add a tag and press Enter"
                      className="bg-background/50 border-white/10 h-11 flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addTag} className="border-white/10 bg-transparent h-11">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6">
              <h2 className="font-display font-semibold text-white mb-5 text-lg">Notes</h2>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional context, background, or notes about this person..."
                rows={4}
                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pb-8">
              <Link href="/contacts">
                <Button type="button" variant="outline" className="border-white/10 bg-transparent">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isPending || !name.trim()} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 px-8">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Contact
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
