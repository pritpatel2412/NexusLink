import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Users, MessagesSquare, CheckSquare, Bell, ArrowRight, Loader2, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { getInitials, generateGradient, cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useGetDashboardStats();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          {greeting()}, {user?.name?.split(' ')[0] || "there"}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your network today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Contacts", value: stats?.totalContacts || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { title: "Interactions this Week", value: stats?.interactionsThisWeek || 0, icon: MessagesSquare, color: "text-primary", bg: "bg-primary/10" },
          { title: "Tasks Due Today", value: stats?.tasksDueToday || 0, icon: CheckSquare, color: "text-amber-400", bg: "bg-amber-400/10" },
          { title: "Upcoming Meetings", value: stats?.upcomingMeetings || 0, icon: Bell, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-border transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white font-mono">{stat.value}</h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Main Activity */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Section */}
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="font-display font-semibold text-lg text-white mb-6">Interaction Activity</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.interactionsByDay || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{ backgroundColor: '#111118', border: '1px solid #1E1E2A', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats?.interactionsByDay || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === (stats?.interactionsByDay?.length || 0) - 1 ? '#6C63FF' : '#2A2A3A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-semibold text-lg text-white">Recent Interactions</h3>
              <Link href="/timeline" className="text-sm text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="space-y-6">
              {stats?.recentActivity?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent activity</div>
              ) : (
                stats?.recentActivity?.map((interaction) => (
                  <div key={interaction.id} className="flex gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white", generateGradient(interaction.contactId))}>
                      {getInitials(interaction.contactName)}
                    </div>
                    <div className="flex-1 pb-6 border-b border-border/30 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-white">
                          <span className="capitalize">{interaction.type}</span> with <Link href={`/contacts/${interaction.contactId}`} className="text-primary hover:underline">{interaction.contactName}</Link>
                        </p>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(interaction.occurredAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{interaction.summary}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="space-y-8">
          {/* Today's Focus */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px]" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-display font-semibold text-lg text-white">Today's Focus</h3>
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold">
                {stats?.todaysFocus?.length || 0}
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              {stats?.todaysFocus?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All caught up for today!</p>
              ) : (
                stats?.todaysFocus?.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                    <div className="mt-0.5 w-4 h-4 rounded-full border border-muted-foreground group-hover:border-primary cursor-pointer transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      {task.contactName && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">For: {task.contactName}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <Link href="/tasks">
                <Button variant="ghost" className="w-full mt-2 text-sm text-muted-foreground hover:text-white">
                  View all tasks <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link href="/contacts/new">
        <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-[0_0_30px_rgba(108,99,255,0.4)] bg-primary hover:bg-primary/90 hover:scale-110 transition-all z-50">
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </Link>
    </div>
  );
}
