import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/error-boundary";
import { 
  LayoutDashboard, Users, Clock, CheckSquare,
  Bell, Sparkles, Settings, LogOut, Plus, Search, Menu, X, CreditCard,
  Briefcase, Network, Shield, Compass, Zap, Linkedin, Github, Globe
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/dashboard",    label: "Dashboard",          icon: LayoutDashboard, external: false },
  { path: "/contacts",     label: "Contacts",           icon: Users,           external: false },
  { path: "/timeline",     label: "Timeline",           icon: Clock,           external: false },
  { path: "/portfolio",    label: "Work Arsenal",       icon: Briefcase,       external: false },
  { path: "/network",      label: "Warm Paths",         icon: Network,         external: false },
  { path: "/assignments",  label: "Assignment Shield",  icon: Shield,          external: false },
  { path: "/opportunities",label: "Opportunities",      icon: Compass,         external: false },
  { path: "/sequences",    label: "Ghost Recovery",     icon: Zap,             external: false },
  { path: "/tasks",        label: "Tasks",              icon: CheckSquare,     external: false },
  { path: "/reminders",    label: "Reminders",          icon: Bell,            external: false },
  { path: "/ai-assistant", label: "AI Assistant",       icon: Sparkles,        external: false },
  { path: "/pricing",      label: "Pricing",            icon: CreditCard,      external: false },
  { path: "/settings",     label: "Settings",           icon: Settings,        external: false },
];

// Bottom nav shows the 5 most important items
const BOTTOM_NAV = [
  { path: "/dashboard",    label: "Home",     icon: LayoutDashboard },
  { path: "/contacts",     label: "Contacts", icon: Users },
  { path: "/tasks",        label: "Tasks",    icon: CheckSquare },
  { path: "/reminders",    label: "Reminders",icon: Bell },
  { path: "/ai-assistant", label: "AI",       icon: Sparkles },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">NexusLink</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4">
        <Link href="/contacts/new" onClick={onClose}>
          <Button className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4" />
            <span>New Contact</span>
          </Button>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.external && location.startsWith(item.path);
          const Icon = item.icon;
          const inner = (
            <div className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
              ${isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}
            `}>
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </div>
          );

          if (item.external) {
            return (
              <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer" onClick={onClose}>
                {inner}
              </a>
            );
          }

          return (
            <Link key={item.path} href={item.path} onClick={onClose}>
              {inner}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
            {getInitials(user?.name || user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground truncate">{user?.plan === "pro" ? "Pro Plan" : "Free Plan"}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {(user as any)?.linkedinUrl && (
                  <a href={(user as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {(user as any)?.githubUrl && (
                  <a href={(user as any).githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="GitHub">
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                {(user as any)?.portfolioUrl && (
                  <a href={(user as any).portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Portfolio">
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => { logout(); onClose?.(); }}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}

interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: "crawler" | "task" | "system";
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "Vercel Signal Matched",
    description: "Tinyfish Crawler matched Next.js Core hiring signals with your target profile.",
    type: "crawler",
    time: "2 mins ago",
    read: false
  },
  {
    id: "n2",
    title: "Task Reminder",
    description: "Follow up with Tuomas Artola (Linear Co-Founder) regarding product intern opening.",
    type: "task",
    time: "1 hour ago",
    read: false
  },
  {
    id: "n3",
    title: "Sync Successful",
    description: "Sarah Jenkins has been added to your CRM contacts list under 'warm-path' tag.",
    type: "system",
    time: "3 hours ago",
    read: true
  },
  {
    id: "n4",
    title: "New Signal Identified",
    description: "Supabase announced a new expansion seed round matching your custom funding triggers.",
    type: "crawler",
    time: "1 day ago",
    read: true
  }
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">

      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-border/50 bg-card/30 hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed top-0 left-0 z-50 h-full w-72 bg-[#0D0D14] border-r border-border/50 flex flex-col md:hidden shadow-2xl shadow-black/60"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <SidebarContent onClose={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header */}
        <header className="h-14 sm:h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-border/50 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-1 shrink-0"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex relative items-center w-56 lg:w-72">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full h-9 pl-9 pr-4 rounded-full bg-secondary/50 border border-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Real-time Notifications Bell dropdown with smooth animations */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`rounded-full relative ${showNotifications ? "bg-white/5 text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </Button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Overlay to close dropdown */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-gradient-to-b from-[#141421] to-[#0A0A0F] border border-white/10 rounded-2xl shadow-2xl p-4 backdrop-blur-xl z-50 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-primary" />
                          <span className="font-bold text-sm text-white">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full shrink-0">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllRead}
                            className="text-xs text-primary hover:text-white transition-colors font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8 text-xs text-muted-foreground italic">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => toggleRead(n.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex gap-3 ${
                                n.read 
                                  ? "bg-card/10 border-white/5 hover:border-white/10" 
                                  : "bg-primary/5 border-primary/20 hover:border-primary/30"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {n.type === "crawler" && <Sparkles className="w-4 h-4 text-accent" />}
                                {n.type === "task" && <CheckSquare className="w-4 h-4 text-primary" />}
                                {n.type === "system" && <Compass className="w-4 h-4 text-emerald-400" />}
                              </div>

                              <div className="flex-1 space-y-1 min-w-0 pr-4">
                                <p className={`text-xs text-white truncate ${!n.read ? "font-bold" : "font-medium"}`}>
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                  {n.description}
                                </p>
                                <span className="text-[9px] text-muted-foreground font-medium block">
                                  {n.time}
                                </span>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(n.id);
                                }}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Dismiss"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link href="/contacts/new">
              <Button className="hidden sm:flex bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-full px-4 lg:px-5 font-medium text-sm transition-all hover:scale-105 active:scale-95">
                <Plus className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden lg:inline">Add Contact</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0A0F]/50 relative pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ErrorBoundary key={location}>
                {children}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0D0D14]/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {BOTTOM_NAV.map((item) => {
            const isActive = location.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-primary/20" : ""}`}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
