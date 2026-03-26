import { useState } from "react";
import { Link } from "wouter";
import { useListContacts } from "@workspace/api-client-react";
import { Search, Plus, Filter, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactCard } from "@/components/contacts/contact-card";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  
  const { data: contacts, isLoading } = useListContacts({ search });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage your network and relationships.</p>
        </div>
        <Link href="/contacts/new">
          <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Contact
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, company, tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50 h-11 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 rounded-xl bg-card border-border/50">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 h-11">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-full w-10 rounded-lg ${view === 'grid' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-full w-10 rounded-lg ${view === 'list' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
              onClick={() => setView('list')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !contacts?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <img 
              src={`${import.meta.env.BASE_URL}images/empty-contacts.png`} 
              alt="No contacts found" 
              className="w-48 h-48 object-cover rounded-3xl opacity-50 mb-6"
            />
            <h3 className="font-display font-semibold text-xl text-white mb-2">No contacts found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">You haven't added anyone yet, or your search didn't match any results.</p>
            <Link href="/contacts/new">
              <Button>Add your first contact</Button>
            </Link>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {contacts.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ContactCard contact={contact} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium hidden md:table-cell">Company & Role</th>
                  <th className="px-6 py-4 font-medium hidden lg:table-cell">Tags</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-border/20 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/contacts/${contact.id}`} className="font-medium text-white hover:text-primary transition-colors">
                        {contact.name}
                      </Link>
                      <div className="text-muted-foreground text-xs md:hidden mt-1">{contact.role} @ {contact.company}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                      {contact.role} {contact.company ? `@ ${contact.company}` : ''}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex gap-1.5 flex-wrap">
                        {contact.tags?.slice(0,2).map(t => (
                          <span key={t.id} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{t.tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/contacts/${contact.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
