import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateMe, getGetMeQueryKey, useExportCsv } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { User, Lock, Download, Bell, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getInitials, generateGradient, cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMe();
  const { refetch: exportCsv, isFetching: isExporting } = useExportCsv({ query: { enabled: false } });

  useEffect(() => {
    if (user) {
      setName((user as any).name || "");
      setEmail((user as any).email || "");
      setTimezone((user as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateMe({ data: { name, email, timezone } });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Profile updated successfully!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to save profile", description: err.message });
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password must be at least 8 characters" });
      return;
    }
    try {
      await updateMe({ data: { currentPassword, newPassword } });
      toast({ title: "Password changed successfully!" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to change password", description: err.message });
    }
  }

  async function handleExport() {
    try {
      const result = await exportCsv();
      const csvText = result.data as unknown as string;
      const blob = new Blob([csvText], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nexuslink-contacts.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Contacts exported!" });
    } catch {
      toast({ variant: "destructive", title: "Export failed" });
    }
  }

  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "data", label: "Data & Export", icon: Download },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Tabs — horizontal scroll on mobile, vertical sidebar on desktop */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 md:px-3 py-2 md:py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 md:w-full",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-white mb-6">Profile Information</h2>

              {/* Avatar section */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border/50">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold",
                  generateGradient((user as any)?.id || "default")
                )}>
                  {getInitials((user as any)?.name)}
                </div>
                <div>
                  <p className="font-semibold text-white">{(user as any)?.name || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
                  <p className="text-xs text-primary mt-1 capitalize">{(user as any)?.plan || "free"} plan</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-background/50 border-white/10 h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-background/50 border-white/10 h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                  <Input
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    placeholder="e.g. America/New_York"
                    className="bg-background/50 border-white/10 h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-white mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/50 border-white/10 h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-background/50 border-white/10 h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/50 border-white/10 h-11"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === "data" && (
            <div className="space-y-4">
              <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-white mb-2">Export Contacts</h2>
                <p className="text-muted-foreground text-sm mb-6">Download all your contacts as a CSV file for backup or migration.</p>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Export All Contacts
                </Button>
              </div>

              <div className="bg-card border border-rose-500/20 rounded-3xl p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-white mb-2">Danger Zone</h2>
                <p className="text-muted-foreground text-sm mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 bg-transparent">
                  Delete Account
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
