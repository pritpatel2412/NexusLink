import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Sparkles, Mail, MessageSquare, Clock, ArrowLeft,
  Send, Check, Loader2, MapPin, Globe, Twitter, Linkedin,
  HelpCircle, Zap, Shield, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TOPICS = [
  { value: "general", label: "General Question" },
  { value: "billing", label: "Billing & Subscriptions" },
  { value: "technical", label: "Technical Support" },
  { value: "privacy", label: "Privacy & Data" },
  { value: "partnership", label: "Partnership / Press" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

const FAQ_SHORTCUTS = [
  { icon: CreditCard, q: "How do I cancel my subscription?", a: "Go to Settings → Billing → Cancel Subscription. You'll retain access until the end of your billing period." },
  { icon: Shield, q: "How do I delete my account and data?", a: "Go to Settings → Delete Account. All your data will be permanently removed within 30 days." },
  { icon: Zap, q: "Can I export my contacts?", a: "Yes — go to the Contacts page and use the Export button to download a CSV of all your contacts and interactions." },
  { icon: HelpCircle, q: "The AI isn't responding correctly. What should I do?", a: "Try refreshing the page. If the issue persists, send us a message and include the approximate time it occurred." },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", topic: "general", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 20) e.message = "Please provide at least 20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you within 24–48 hours." });
  };

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/6 blur-[120px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">NexusLink</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            <MessageSquare className="w-3.5 h-3.5" />
            We'd love to hear from you
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">Get in Touch</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Have a question, found a bug, or want to explore a partnership? We respond to every message.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: info + FAQ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Support channels */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-5"
            >
              <h2 className="font-display font-bold text-lg text-white">Support Channels</h2>

              {[
                {
                  icon: Mail,
                  label: "Email Support",
                  value: "support@nexuslink.app",
                  sub: "Replies within 24–48 hours",
                  href: "mailto:support@nexuslink.app",
                },
                {
                  icon: MessageSquare,
                  label: "In-App Chat",
                  value: "Live chat widget",
                  sub: "Available on Pro & Enterprise plans",
                  href: null,
                },
                {
                  icon: Clock,
                  label: "Business Hours",
                  value: "Mon – Fri, 9 AM – 6 PM IST",
                  sub: "UTC+5:30",
                  href: null,
                },
              ].map(({ icon: Icon, label, value, sub, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    {href ? (
                      <a href={href} className="text-white text-sm hover:text-primary transition-colors">{value}</a>
                    ) : (
                      <p className="text-white text-sm">{value}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Social */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border/50 rounded-2xl p-6"
            >
              <h2 className="font-display font-bold text-lg text-white mb-4">Follow Us</h2>
              <div className="space-y-3">
                {[
                  { icon: Twitter, label: "Twitter / X", handle: "@nexuslinkapp", href: "https://twitter.com/nexuslinkapp" },
                  { icon: Linkedin, label: "LinkedIn", handle: "NexusLink", href: "https://linkedin.com/company/nexuslink" },
                  { icon: Globe, label: "Website", handle: "nexuslink.app", href: "/" },
                ].map(({ icon: Icon, label, handle, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-white transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                    <span className="flex-1">{label}</span>
                    <span className="text-xs">{handle}</span>
                  </a>
                ))}
              </div>
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl p-6"
            >
              <h2 className="font-display font-bold text-lg text-white mb-4">Quick Answers</h2>
              <div className="space-y-4">
                {FAQ_SHORTCUTS.map(({ icon: Icon, q, a }) => (
                  <div key={q} className="group">
                    <div className="flex items-start gap-2.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-white leading-snug">{q}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-6">{a}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="bg-card border border-border/50 rounded-3xl p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-white mb-3">Message Sent!</h2>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Thank you for reaching out. We'll get back to you at <strong className="text-white">{form.email}</strong> within 24–48 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "general", subject: "", message: "" }); }}
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-display font-bold text-2xl text-white mb-2">Send a Message</h2>
                  <p className="text-muted-foreground text-sm mb-7">Fill in the form and we'll respond as soon as possible.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5">Full Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => update("name", e.target.value)}
                          placeholder="Alex Johnson"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl bg-background border text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors",
                            errors.name ? "border-red-500/60" : "border-border/60"
                          )}
                        />
                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1.5">Email Address <span className="text-red-400">*</span></label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => update("email", e.target.value)}
                          placeholder="you@example.com"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl bg-background border text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors",
                            errors.email ? "border-red-500/60" : "border-border/60"
                          )}
                        />
                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    {/* Topic */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Topic</label>
                      <select
                        value={form.topic}
                        onChange={e => update("topic", e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-background border border-border/60 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors appearance-none"
                      >
                        {TOPICS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Subject <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={e => update("subject", e.target.value)}
                        placeholder="Brief description of your inquiry"
                        className={cn(
                          "w-full h-11 px-4 rounded-xl bg-background border text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors",
                          errors.subject ? "border-red-500/60" : "border-border/60"
                        )}
                      />
                      {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject}</p>}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">Message <span className="text-red-400">*</span></label>
                      <textarea
                        value={form.message}
                        onChange={e => update("message", e.target.value)}
                        placeholder="Describe your question or issue in detail..."
                        rows={5}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl bg-background border text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors resize-none",
                          errors.message ? "border-red-500/60" : "border-border/60"
                        )}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {errors.message ? (
                          <p className="text-xs text-red-400">{errors.message}</p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-muted-foreground">{form.message.length} chars</p>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our{" "}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      {" "}and{" "}
                      <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border/30 flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
          <span>© 2026 NexusLink. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
        </div>
      </div>
    </div>
  );
}
