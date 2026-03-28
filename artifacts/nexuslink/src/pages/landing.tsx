import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Sparkles, BrainCircuit, Zap, ArrowRight, CheckCircle2,
  CheckSquare, Play, Pause, Users, MessageSquare, Bell,
  Star, Clock, Shield, Globe, ChevronRight, Mail,
  Calendar, Phone, FileText, TrendingUp, X,
  Check, RefreshCw, Crown, Brain, Headphones
} from "lucide-react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import GradientBlinds from "@/components/ui/GradientBlinds";

// ─── Animated Counter ──────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = value / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

// ─── Floating Orb ─────────────────────────────────────────────────────
function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[80px] opacity-30 pointer-events-none ${className}`}
      animate={{ y: [0, -30, 0], scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

// ─── Product Demo Video Section ────────────────────────────────────────
const DEMO_SCREENS = [
  {
    label: "Dashboard",
    color: "from-indigo-600/20 to-violet-600/20",
    accent: "#6C63FF",
    content: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="h-5 w-32 bg-white/10 rounded-lg" />
          <div className="h-5 w-20 bg-primary/30 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[["12", "Contacts"], ["8", "This Week"], ["3", "Due Today"], ["2", "Meetings"]].map(([v, l], i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }}
              className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-lg font-bold text-white font-mono">{v}</p>
              <p className="text-[9px] text-white/40 leading-tight mt-0.5">{l}</p>
            </motion.div>
          ))}
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[9px] text-white/40 mb-2 uppercase tracking-wider">Recent Activity</p>
          {[
            { icon: "📞", text: "Call with Sarah Chen", time: "2h ago", c: "text-blue-400" },
            { icon: "📧", text: "Email from Marcus Lee", time: "5h ago", c: "text-violet-400" },
            { icon: "📅", text: "Meeting: Q4 Review", time: "Yesterday", c: "text-emerald-400" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 + 0.5 }}
              className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[10px] text-white/70 flex-1">{item.text}</span>
              <span className={`text-[9px] ${item.c}`}>{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    label: "Contacts",
    color: "from-violet-600/20 to-fuchsia-600/20",
    accent: "#A78BFA",
    content: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="h-2.5 w-24 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2 flex-1">
          {[
            { n: "Aisha Patel", r: "CEO, TechVentures", g: "from-indigo-500 to-violet-500" },
            { n: "Marcus Lee", r: "Angel Investor", g: "from-violet-500 to-pink-500" },
            { n: "Sarah Chen", r: "Product Lead", g: "from-emerald-500 to-teal-500" },
            { n: "James Wright", r: "CTO, CloudIO", g: "from-blue-500 to-indigo-500" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 + 0.2 }}
              className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-colors">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.g} flex items-center justify-center text-white text-[10px] font-bold mb-2`}>
                {c.n.split(" ").map(w => w[0]).join("")}
              </div>
              <p className="text-[10px] font-semibold text-white leading-tight">{c.n}</p>
              <p className="text-[8px] text-white/40 mt-0.5">{c.r}</p>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    label: "AI Brief",
    color: "from-fuchsia-600/20 to-pink-600/20",
    accent: "#EC4899",
    content: (
      <div className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-white">Pre-Meeting Brief</p>
            <p className="text-[8px] text-white/40">Aisha Patel · AI Generated</p>
          </div>
        </div>
        <motion.div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          {[
            { title: "Who She Is", body: "CEO of TechVentures, Series B stage. Previously founded DataSync (acquired 2022)." },
            { title: "Last Discussed", body: "Partnership on AI features, demo scheduled for next week." },
            { title: "Talking Points", body: "• Ask about Q4 roadmap\n• Propose co-marketing deal\n• Follow up on intro to Sam" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 + 0.5 }}>
              <p className="text-[8px] text-primary uppercase tracking-wider mb-1">{s.title}</p>
              <p className="text-[9px] text-white/60 leading-relaxed whitespace-pre-line">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="h-7 bg-gradient-to-r from-primary/30 to-accent/30 rounded-lg flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <p className="text-[9px] text-white font-medium">✨ Regenerate with latest context</p>
        </motion.div>
      </div>
    )
  },
  {
    label: "Timeline",
    color: "from-blue-600/20 to-cyan-600/20",
    accent: "#60A5FA",
    content: (
      <div className="p-5 h-full flex flex-col gap-2">
        <p className="text-[9px] text-white/40 uppercase tracking-wider">Today</p>
        <div className="flex-1 pl-3 border-l-2 border-white/10 space-y-3">
          {[
            { icon: Phone, c: "text-blue-400", bg: "bg-blue-400/10", t: "Call", d: "Discussed Series A plans and team expansion", time: "10:30 AM" },
            { icon: Mail, c: "text-violet-400", bg: "bg-violet-400/10", t: "Email", d: "Sent partnership proposal with pricing", time: "2:15 PM" },
            { icon: Calendar, c: "text-emerald-400", bg: "bg-emerald-400/10", t: "Meeting", d: "Product roadmap alignment — confirmed Q4 launch", time: "4:00 PM" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.18 + 0.2 }}
              className="relative">
              <div className={`absolute -left-[17px] w-5 h-5 rounded-full ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-2.5 h-2.5 ${item.c}`} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 ml-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-semibold text-white">{item.t}</span>
                  <span className="text-[8px] text-white/30">{item.time}</span>
                </div>
                <p className="text-[8px] text-white/50 leading-relaxed">{item.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
];

function ProductDemoVideo() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveScreen(s => (s + 1) % DEMO_SCREENS.length);
      }, 3500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const screen = DEMO_SCREENS[activeScreen];

  return (
    <>
      <div className="relative max-w-4xl mx-auto">
        {/* Outer glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-[32px] blur-xl" />

        {/* Browser chrome frame */}
        <motion.div
          className="relative bg-[#0D0D14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0A0A10] border-b border-white/5">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/70" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/70" />
            </div>
            <div className="hidden sm:flex flex-1 mx-2 sm:mx-4 h-6 bg-white/5 border border-white/5 rounded-md items-center px-3 gap-2 min-w-0">
              <Shield className="w-3 h-3 text-emerald-400/60 shrink-0" />
              <span className="text-[10px] text-white/30 truncate">app.nexuslink.io/dashboard</span>
            </div>
            {/* Screen tabs — scrollable on mobile */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1 sm:flex-none">
              {DEMO_SCREENS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveScreen(i); setIsPlaying(false); }}
                  className={`text-[9px] px-2 sm:px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap shrink-0 ${activeScreen === i ? "bg-primary/20 text-primary" : "text-white/30 hover:text-white/60"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* App shell */}
          <div className="flex h-[280px] sm:h-[340px] md:h-[380px]">
            {/* Sidebar */}
            <div className="w-14 bg-[#080810] border-r border-white/5 flex flex-col items-center pt-4 gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              {[Users, Clock, CheckSquare, Bell, Sparkles].map((Icon, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${i === activeScreen ? "bg-primary/20" : "hover:bg-white/5"}`}>
                  <Icon className={`w-4 h-4 ${i === activeScreen ? "text-primary" : "text-white/20"}`} />
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className={`flex-1 bg-gradient-to-br ${screen.color} relative overflow-hidden`}>
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScreen}
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {screen.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0A0A10] border-t border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                {isPlaying
                  ? <><Pause className="w-3 h-3" /> Pause demo</>
                  : <><Play className="w-3 h-3" /> Play demo</>}
              </button>
              {/* Progress dots */}
              <div className="flex gap-1.5">
                {DEMO_SCREENS.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { setActiveScreen(i); setIsPlaying(false); }}
                    className={`rounded-full transition-all ${activeScreen === i ? "bg-primary w-4 h-1.5" : "bg-white/20 w-1.5 h-1.5"}`}
                    whileHover={{ scale: 1.3 }}
                  />
                ))}
              </div>
            </div>
            <motion.button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
            >
              <Play className="w-3 h-3" /> Watch full video
            </motion.button>
          </div>
        </motion.div>

        {/* Floating badges */}
        <motion.div
          className="absolute -left-6 top-1/3 bg-card border border-white/10 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-xl hidden md:flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Network Growth</p>
            <p className="text-[10px] text-emerald-400">+23% this month</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute -right-6 bottom-1/4 bg-card border border-white/10 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-xl hidden md:flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">AI Brief Ready</p>
            <p className="text-[10px] text-primary">Meeting in 30 min</p>
          </div>
        </motion.div>
      </div>

      {/* Full video modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="relative w-full max-w-3xl bg-[#0A0A10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-display font-semibold text-white">NexusLink Product Demo</span>
                </div>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-white font-semibold mb-1">Product Walkthrough</p>
                    <p className="text-muted-foreground text-sm">3:42 · How NexusLink transforms your networking</p>
                  </div>
                </div>
                {/* Animated background grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "30px 30px"
                }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────
const HOW_STEPS = [
  { num: "01", title: "Add Your Network", desc: "Import contacts from LinkedIn, CSV, or add them manually in seconds. Rich profiles with every detail.", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
  { num: "02", title: "Log Every Touch", desc: "Record calls, meetings, emails, and notes with one click. Your interaction history builds automatically.", icon: MessageSquare, color: "text-violet-400", bg: "bg-violet-400/10" },
  { num: "03", title: "Get AI-Powered Insights", desc: "Before every meeting, NexusLink generates a personalized brief with context, history, and talking points.", icon: BrainCircuit, color: "text-primary", bg: "bg-primary/10" },
  { num: "04", title: "Never Miss a Beat", desc: "Smart reminders and task tracking keep your relationships warm and your commitments on track.", icon: Bell, color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

// ─── Testimonials ──────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Alex Rivera", role: "Founder, Luminary Labs", avatar: "AR", gradient: "from-indigo-500 to-violet-500", quote: "NexusLink completely changed how I manage investor relationships. The AI briefs are insane — like having a personal assistant who remembers everything." },
  { name: "Priya Sharma", role: "Freelance Consultant", avatar: "PS", gradient: "from-violet-500 to-pink-500", quote: "I was drowning in sticky notes and calendar reminders. NexusLink brought order to my network chaos. Now I close 40% more deals." },
  { name: "Jordan Kim", role: "Creator & Brand Partner", avatar: "JK", gradient: "from-emerald-500 to-teal-500", quote: "As a creator, relationships are everything. NexusLink helps me stay genuine with every brand partner and collab without losing track." },
];

const FEATURES = [
  { icon: BrainCircuit, title: "AI Memory Engine", desc: "Remembers every interaction and generates contextual briefs automatically." },
  { icon: Zap, title: "1-Click Logging", desc: "Log any interaction in seconds — call, email, meeting, or note." },
  { icon: CheckSquare, title: "Smart Task Tracking", desc: "Tasks linked to contacts with priority and due date management." },
  { icon: Bell, title: "Intelligent Reminders", desc: "Never miss a follow-up with context-aware reminder scheduling." },
  { icon: Globe, title: "Import & Export", desc: "CSV import/export for LinkedIn, HubSpot, and any contact list." },
  { icon: Shield, title: "Private by Default", desc: "Your relationship data stays yours. No ads, no third-party sharing." },
];

// ─── Main Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [hoveredTestimonial, setHoveredTestimonial] = useState<number | null>(null);
  const [pricingINR, setPricingINR] = useState(false);
  const { toast } = useToast();

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
  };

  const stagger = {
    show: { transition: { staggerChildren: 0.12 } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/30">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GradientBlinds
          gradientColors={['#FF9FFC', '#5227FF']}
          angle={0}
          noise={0.3}
          blindCount={12}
          blindMinWidth={50}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>

      {/* ── Header ── */}
      <motion.header
        className="relative z-20 container mx-auto px-6 py-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <span className="font-display font-bold text-2xl tracking-tight text-white">NexusLink</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {["Features", "How It Works", "Pricing", "Demo"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="hover:text-white transition-colors relative group"
              whileHover={{ y: -1 }}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/10 hidden sm:flex rounded-full px-5">Log in</Button>
          </Link>
          <Link href="/signup">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                Start Free
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.header>

      <main className="relative z-10">

        {/* ── Hero Section ── */}
        <section className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUp}>
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 backdrop-blur-md"
                whileHover={{ scale: 1.05, borderColor: "rgba(108,99,255,0.5)" }}
              >
                <motion.div animate={{ rotate: [0, 15, -10, 15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Introducing AI Memory Assistant</span>
                <ChevronRight className="w-3 h-3" />
              </motion.div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05] text-white"
            >
              Your Second Brain for{" "}
              <br />
              <motion.span
                className="text-gradient inline-block"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% auto" }}
              >
                Every Relationship
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              NexusLink remembers every conversation, interaction, and follow-up so you can focus on building meaningful connections — not managing spreadsheets.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full text-lg font-semibold shadow-[0_0_40px_rgba(108,99,255,0.35)] transition-all">
                    Start for Free
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              <motion.a href="#demo" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg font-medium border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md gap-2">
                  <Play className="w-5 h-5 text-primary" /> Watch Demo
                </Button>
              </motion.a>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats Banner ── */}
        <motion.section
          className="py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: 12000, suffix: "+", label: "Professionals" },
                { value: 98, suffix: "%", label: "Satisfaction Rate" },
                { value: 2500000, suffix: "+", label: "Interactions Logged" },
                { value: 40, suffix: "%", label: "More Deals Closed" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="font-display text-4xl font-extrabold text-white mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Product Demo Video ── */}
        <section id="demo" className="py-24 px-6">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-4">
                <Play className="w-3 h-3" /> Live Product Demo
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                See NexusLink in Action
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Watch how founders, freelancers, and creators manage their relationships smarter — not harder.
              </p>
            </motion.div>
            <ProductDemoVideo />
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
                <Zap className="w-3 h-3" /> Everything You Need
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Built for Relationship Builders
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every feature designed to reduce friction and amplify your network's potential.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -6, borderColor: "rgba(108,99,255,0.3)" }}
                  className="bg-card/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 group cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <feat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold mb-4">
                <CheckCircle2 className="w-3 h-3" /> Simple Process
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Up and Running in Minutes
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                No complex setup. No training required. Just results.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {HOW_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  className="relative flex gap-5 p-6 bg-card/60 border border-white/5 rounded-2xl group hover:border-white/10 transition-all"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                >
                  <div className={`w-12 h-12 rounded-2xl ${step.bg} flex items-center justify-center shrink-0`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-muted-foreground/60 font-bold">{step.num}</span>
                      <h3 className="font-display font-bold text-white text-lg">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  <motion.div
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ x: 2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, type: "spring" }}
                  >
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </motion.div>
                ))}
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Loved by Builders
              </h2>
              <p className="text-muted-foreground">Join thousands who've transformed their networking game.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  className="bg-card/60 border border-white/5 rounded-2xl p-6 cursor-default relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -6, borderColor: "rgba(108,99,255,0.25)" }}
                  onHoverStart={() => setHoveredTestimonial(i)}
                  onHoverEnd={() => setHoveredTestimonial(null)}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                    animate={{ opacity: hoveredTestimonial === i ? 1 : 0 }}
                  />
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{t.name}</p>
                        <p className="text-muted-foreground text-xs">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-24 px-6">
          <div className="container mx-auto max-w-5xl">

            {/* Header */}
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Simple, transparent pricing
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Invest in your{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">relationships</span>
              </h2>
              <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready. Pay in USD or INR.</p>
            </motion.div>

            {/* Currency Toggle */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative flex items-center gap-1 p-1.5 rounded-2xl bg-card border border-border/60 shadow-lg">
                <motion.div
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-primary/15 border border-primary/25"
                  animate={{ left: pricingINR ? "calc(50% + 2px)" : "6px", right: pricingINR ? "6px" : "calc(50% + 2px)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
                <button
                  onClick={() => setPricingINR(false)}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors min-w-[130px] justify-center",
                    !pricingINR ? "text-white" : "text-muted-foreground hover:text-white/70"
                  )}
                >
                  <span className="text-base">🇺🇸</span>
                  <div className="text-left">
                    <p className="text-[11px] font-bold leading-none">USD</p>
                    <p className="text-[10px] font-normal text-muted-foreground leading-none mt-0.5">via Stripe</p>
                  </div>
                  <div className="w-3.5 h-3.5 rounded-sm bg-[#635BFF] flex items-center justify-center">
                    <span className="text-[6px] text-white font-black">S</span>
                  </div>
                </button>
                <div className="w-px h-5 bg-border/60 relative z-10" />
                <button
                  onClick={() => setPricingINR(true)}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors min-w-[130px] justify-center",
                    pricingINR ? "text-white" : "text-muted-foreground hover:text-white/70"
                  )}
                >
                  <span className="text-base">🇮🇳</span>
                  <div className="text-left">
                    <p className="text-[11px] font-bold leading-none">INR</p>
                    <p className="text-[10px] font-normal text-muted-foreground leading-none mt-0.5">via Razorpay</p>
                  </div>
                  <div className="w-3.5 h-3.5 rounded-sm bg-[#3395FF] flex items-center justify-center">
                    <span className="text-[6px] text-white font-black">R</span>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Flip hint */}
            <AnimatePresence mode="wait">
              <motion.p
                key={pricingINR ? "inr" : "usd"}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-muted-foreground/55 -mt-2 mb-10 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Showing {pricingINR ? "₹ INR · Razorpay" : "$ USD · Stripe"} — toggle to switch
              </motion.p>
            </AnimatePresence>

            {/* 3-column flip cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  id: "starter", Icon: Zap, label: "Starter", badge: null,
                  usd: { price: 0, label: "Free" }, inr: { price: 0, label: "Free" },
                  color: "from-slate-500/15 to-slate-600/15", border: "border-white/10",
                  features: ["Up to 50 contacts", "Basic timeline", "5 AI queries / day", "Task & reminder management", "CSV export", "Email support"],
                },
                {
                  id: "pro", Icon: Brain, label: "Pro", badge: "Most Popular",
                  usd: { price: 12, label: "$12" }, inr: { price: 999, label: "₹999" },
                  color: "from-primary/20 to-accent/15", border: "border-primary/40",
                  features: ["Unlimited contacts", "Full AI assistant — chat, briefs, score", "Network Pulse & Relationship IQ", "Smart Note Summarizer", "Voice input + file attachments", "Priority support"],
                },
                {
                  id: "enterprise", Icon: Crown, label: "Enterprise", badge: "Best Value",
                  usd: { price: 49, label: "$49" }, inr: { price: 3999, label: "₹3,999" },
                  color: "from-amber-500/15 to-orange-500/10", border: "border-amber-500/25",
                  features: ["Everything in Pro", "Team workspace — up to 10 users", "Custom AI persona & tone", "CRM data API access", "Dedicated account manager", "99.9% uptime SLA"],
                },
              ].map((plan, i) => {
                const isPro = plan.id === "pro";
                const isFree = pricingINR ? plan.inr.price === 0 : plan.usd.price === 0;
                const displayPrice = pricingINR ? plan.inr.label : plan.usd.label;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    style={{ perspective: "1200px" }}
                  >
                    <motion.div
                      animate={{ rotateY: pricingINR ? 180 : 0 }}
                      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
                      style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 460 }}
                    >
                      {/* Front — USD / Stripe */}
                      {[false, true].map((isBack) => (
                        <div
                          key={String(isBack)}
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            ...(isBack ? { transform: "rotateY(180deg)", position: "absolute", inset: 0 } : {}),
                          }}
                          className={cn(
                            "rounded-3xl border bg-gradient-to-br p-6 flex flex-col h-full",
                            plan.color, plan.border,
                            isPro && "ring-1 ring-primary/30",
                            !isBack && "absolute inset-0"
                          )}
                        >
                          {/* Badge */}
                          {plan.badge && (
                            <div className={cn(
                              "self-start mb-3 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase",
                              isPro ? "bg-primary/20 text-primary border border-primary/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            )}>
                              {plan.badge}
                            </div>
                          )}

                          {/* Name */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isPro ? "bg-primary/20 border border-primary/30" : "bg-white/8 border border-white/10")}>
                              <plan.Icon className={cn("w-4 h-4", isPro ? "text-primary" : "text-white/70")} />
                            </div>
                            <h3 className="font-display font-bold text-lg text-white">{plan.label}</h3>
                          </div>

                          {/* Price */}
                          <div className="mb-1">
                            {(isBack ? plan.inr.price === 0 : plan.usd.price === 0) ? (
                              <p className="text-3xl font-display font-black text-white">Free</p>
                            ) : (
                              <div className="flex items-end gap-1">
                                <p className="text-3xl font-display font-black text-white">{isBack ? plan.inr.label : plan.usd.label}</p>
                                <p className="text-muted-foreground text-sm mb-1">/ month</p>
                              </div>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-1 mb-4">
                              {(isBack ? plan.inr.price === 0 : plan.usd.price === 0) ? "No credit card required" : isBack ? "Billed monthly · Razorpay" : "Billed monthly · Stripe"}
                            </p>
                          </div>

                          {/* Provider badge */}
                          {!(isBack ? plan.inr.price === 0 : plan.usd.price === 0) && (
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border mb-4 w-fit", isBack ? "bg-blue-500/8 border-blue-500/20" : "bg-violet-500/8 border-violet-500/20")}>
                              <div className={cn("w-3.5 h-3.5 rounded-sm flex items-center justify-center", isBack ? "bg-[#3395FF]" : "bg-[#635BFF]")}>
                                <span className="text-[6px] text-white font-black">{isBack ? "R" : "S"}</span>
                              </div>
                              <span className={cn("text-[11px] font-medium", isBack ? "text-blue-300" : "text-violet-300")}>{isBack ? "Razorpay" : "Stripe"}</span>
                            </div>
                          )}

                          <div className="border-t border-white/8 mb-4" />

                          {/* Features */}
                          <ul className="space-y-2 flex-1">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                                <Check className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", isPro ? "text-primary" : "text-emerald-400")} />
                                {f}
                              </li>
                            ))}
                          </ul>

                          {/* CTA */}
                          <button
                            onClick={() => {
                              if (isBack ? plan.inr.price === 0 : plan.usd.price === 0) {
                                window.location.href = "/signup";
                              } else if (isBack) {
                                toast({ title: "Razorpay Checkout", description: `Opening Razorpay for ${plan.label} at ${plan.inr.label}/month.` });
                              } else {
                                toast({ title: "Stripe Checkout", description: `Opening Stripe for ${plan.label} at ${plan.usd.label}/month.` });
                              }
                            }}
                            className={cn(
                              "mt-5 w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5",
                              (isBack ? plan.inr.price === 0 : plan.usd.price === 0)
                                ? "bg-white/8 border border-white/12 text-white hover:bg-white/12"
                                : isPro
                                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:opacity-90 hover:scale-[1.02]"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/15 hover:opacity-90 hover:scale-[1.02]"
                            )}
                          >
                            {(isBack ? plan.inr.price === 0 : plan.usd.price === 0)
                              ? "Get Started Free"
                              : isBack
                              ? "Pay with Razorpay →"
                              : "Pay with Stripe →"}
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-border/30"
            >
              {[
                { icon: Shield, text: "256-bit SSL" },
                { icon: Globe, text: "GDPR Compliant" },
                { icon: RefreshCw, text: "Cancel Anytime" },
                { icon: Headphones, text: "24/7 Support" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Icon className="w-4 h-4 text-primary/60" />
                  {text}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              className="relative bg-gradient-to-br from-primary/20 via-card to-accent/10 border border-white/10 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <FloatingOrb className="w-64 h-64 bg-primary -top-16 -left-16" delay={0} />
                <FloatingOrb className="w-48 h-48 bg-accent -bottom-12 -right-12" delay={2} />
              </div>
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -5, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-12 h-12 text-primary mx-auto" />
                </motion.div>
                <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-4">
                  Start Building Better Relationships
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
                  Join 12,000+ founders, freelancers, and creators who never let a connection fall through the cracks.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-14 px-10 bg-white text-black hover:bg-gray-100 rounded-full text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                        Get Started Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-white/10 bg-white/5 hover:bg-white/10">
                      Sign in
                    </Button>
                  </Link>
                </div>
                <p className="text-muted-foreground text-sm mt-6">Free forever • No credit card • Set up in 2 minutes</p>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white">NexusLink</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 NexusLink. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
