import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, Clock, CheckSquare, 
  Bell, Sparkles, Settings, LogOut, Plus, Search, Menu
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/contacts", label: "Contacts", icon: Users },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/reminders", label: "Reminders", icon: Bell },
  { path: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border/50 bg-card/30 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">NexusLink</span>
          </Link>
        </div>

        <div className="p-4">
          <Button className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4" />
            <span>New Contact</span>
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-md">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 border-b border-border/50 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex relative items-center w-64 max-w-md">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search anything (Cmd+K)..." 
                className="w-full h-10 pl-9 pr-4 rounded-full bg-secondary/50 border border-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </Button>
            <Link href="/contacts/new">
              <Button className="hidden sm:flex bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-full px-5 font-medium transition-all hover:scale-105 active:scale-95">
                Add Interaction
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0A0F]/50 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
