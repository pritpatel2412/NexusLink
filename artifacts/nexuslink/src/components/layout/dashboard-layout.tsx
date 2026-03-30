import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/error-boundary";
import { 
  LayoutDashboard, Users, Clock, CheckSquare,
  Bell, Sparkles, Settings, LogOut, Plus, Search, Menu, X, CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { path: "/contacts",     label: "Contacts",     icon: Users },
  { path: "/timeline",     label: "Timeline",     icon: Clock },
  { path: "/tasks",        label: "Tasks",        icon: CheckSquare },
  { path: "/reminders",    label: "Reminders",    icon: Bell },
  { path: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { path: "/pricing",      label: "Pricing",      icon: CreditCard },
  { path: "/settings",     label: "Settings",     icon: Settings },
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
          const isActive = location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path} onClick={onClose}>
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

      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
            {getInitials(user?.name || user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.plan === "pro" ? "Pro Plan" : "Free Plan"}</p>
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
            <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Button>
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
