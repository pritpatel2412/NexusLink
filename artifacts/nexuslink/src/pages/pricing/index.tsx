import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, Zap, Crown, Building2, ArrowLeft,
  Star, Shield, Globe, Headphones, Users, Brain, Mic,
  Paperclip, BarChart3, RefreshCw, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Plan data ────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "starter",
    icon: Zap,
    label: "Starter",
    badge: null,
    usd: { price: 0, period: "forever", label: "Free" },
    inr: { price: 0, period: "forever", label: "Free" },
    color: "from-slate-500/20 to-slate-600/20",
    border: "border-white/10",
    glow: "shadow-white/5",
    features: [
      "Up to 50 contacts",
      "Basic interaction timeline",
      "5 AI queries / day",
      "Task & reminder management",
      "CSV export",
      "Email support",
    ],
    stripe: null,
    razorpay: null,
  },
  {
    id: "pro",
    icon: Brain,
    label: "Pro",
    badge: "Most Popular",
    usd: { price: 12, period: "month", label: "$12" },
    inr: { price: 999, period: "month", label: "₹999" },
    color: "from-primary/25 to-accent/20",
    border: "border-primary/40",
    glow: "shadow-primary/20",
    features: [
      "Unlimited contacts",
      "Full AI assistant — chat, briefs, score",
      "Network Pulse & Relationship IQ",
      "Smart Note Summarizer",
      "Voice input + file attachments",
      "Password-protected account",
      "Priority support",
    ],
    stripe: "price_pro_usd_monthly",
    razorpay: "plan_pro_inr_monthly",
  },
  {
    id: "enterprise",
    icon: Crown,
    label: "Enterprise",
    badge: "Best Value",
    usd: { price: 49, period: "month", label: "$49" },
    inr: { price: 3999, period: "month", label: "₹3,999" },
    color: "from-amber-500/20 to-orange-500/15",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    features: [
      "Everything in Pro",
      "Team workspace — up to 10 users",
      "Custom AI persona & tone",
      "CRM data API access",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% uptime SLA",
    ],
    stripe: "price_enterprise_usd_monthly",
    razorpay: "plan_enterprise_inr_monthly",
  },
];

// ── Stripe logo (SVG inline) ──────────────────────────────────────────
function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 25" fill="none">
      <path d="M5.45 10.2c0-1.05.87-1.46 2.3-1.46 2.05 0 4.65.62 6.7 1.72V4.7C12.28 3.68 10.1 3.28 7.75 3.28 3.07 3.28 0 5.68 0 10.47c0 7.45 10.28 6.25 10.28 9.46 0 1.24-1.08 1.64-2.59 1.64-2.24 0-5.1-.92-7.37-2.17v5.84c2.51 1.08 5.05 1.53 7.37 1.53 5.62 0 9.46-2.27 9.46-7.16-.01-8.06-10.2-6.59-10.2-9.41zm16.16-9.1L16.4 2.23v4.3l5.21-1.12V1.1zm-5.21 5.38h5.21V26h-5.21V6.48zm19.52-.35c-1.87 0-3.07.88-3.74 1.49l-.25-1.14h-4.65V32l5.28-1.12.01-6.36c.69.5 1.7 1.2 3.33 1.2 3.36 0 6.42-2.7 6.42-8.64-.01-5.44-3.1-8.95-6.4-8.95zm-1.13 13.73c-1.1 0-1.76-.4-2.21-.88l-.03-6.94c.49-.54 1.17-.92 2.24-.92 1.71 0 2.89 1.91 2.89 4.35 0 2.5-1.16 4.39-2.89 4.39zM46.95 0l-5.29 1.12.01 22.77 5.28-1.12V0zm7.86 7.57l-3.37.72V26h5.25V11.16l-1.88-.4V7.57zm-.41-4.29c-1.71 0-2.77 1.14-2.77 2.64 0 1.47 1.04 2.61 2.73 2.61s2.77-1.14 2.77-2.61c0-1.5-1.04-2.64-2.73-2.64z" fill="currentColor" />
    </svg>
  );
}

// ── Razorpay logo (SVG inline) ────────────────────────────────────────
function RazorpayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 30" fill="none">
      <path d="M19.96 0L7.5 18.75h7.5L3.75 30l25-15H21.25L33.75 0z" fill="#3395FF" />
      <text x="38" y="22" fill="currentColor" fontSize="18" fontWeight="700" fontFamily="sans-serif">razorpay</text>
    </svg>
  );
}

// ── Flip Card ────────────────────────────────────────────────────────
function PricingCard({ plan, isINR, delay }: {
  plan: typeof PLANS[0];
  isINR: boolean;
  delay: number;
}) {
  const { toast } = useToast();
  const Icon = plan.icon;
  const pricing = isINR ? plan.inr : plan.usd;
  const isFree = pricing.price === 0;

  const handleCheckout = () => {
    if (isFree) {
      window.location.href = "/signup";
      return;
    }
    if (isINR) {
      toast({
        title: "Razorpay Checkout",
        description: `Opening Razorpay for ${plan.label} plan at ${plan.inr.label}/month. Integrate your Razorpay key ID to activate.`,
      });
    } else {
      toast({
        title: "Stripe Checkout",
        description: `Opening Stripe for ${plan.label} plan at ${plan.usd.label}/month. Integrate your Stripe publishable key to activate.`,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ perspective: "1200px" }}
      className="w-full"
    >
      {/* Flip container */}
      <motion.div
        animate={{ rotateY: isINR ? 180 : 0 }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 480 }}
        className="w-full"
      >
        {/* ── FRONT (USD / Stripe) ── */}
        <div
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          className={cn(
            "absolute inset-0 rounded-3xl border bg-gradient-to-br p-7 flex flex-col shadow-xl",
            plan.color, plan.border, `shadow-${plan.glow}`,
            plan.badge === "Most Popular" && "ring-1 ring-primary/40"
          )}
        >
          <CardContent
            plan={plan}
            pricing={plan.usd}
            isINR={false}
            onCheckout={handleCheckout}
          />
        </div>

        {/* ── BACK (INR / Razorpay) ── */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className={cn(
            "absolute inset-0 rounded-3xl border bg-gradient-to-br p-7 flex flex-col shadow-xl",
            plan.color, plan.border,
            plan.badge === "Most Popular" && "ring-1 ring-primary/40"
          )}
        >
          <CardContent
            plan={plan}
            pricing={plan.inr}
            isINR={true}
            onCheckout={handleCheckout}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Card inner content (shared for front/back) ───────────────────────
function CardContent({ plan, pricing, isINR, onCheckout }: {
  plan: typeof PLANS[0];
  pricing: { price: number; period: string; label: string };
  isINR: boolean;
  onCheckout: () => void;
}) {
  const Icon = plan.icon;
  const isFree = pricing.price === 0;
  const isPro = plan.id === "pro";

  return (
    <>
      {/* Badge */}
      {plan.badge && (
        <div className={cn(
          "self-start mb-4 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase",
          isPro ? "bg-primary/20 text-primary border border-primary/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
        )}>
          {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          isPro ? "bg-primary/20 border border-primary/30" : "bg-white/8 border border-white/10"
        )}>
          <Icon className={cn("w-4 h-4", isPro ? "text-primary" : "text-white/70")} />
        </div>
        <h3 className="font-display font-bold text-xl text-white">{plan.label}</h3>
      </div>

      {/* Price */}
      <div className="mb-2">
        {isFree ? (
          <p className="text-4xl font-display font-black text-white">Free</p>
        ) : (
          <div className="flex items-end gap-1.5">
            <p className="text-4xl font-display font-black text-white">{pricing.label}</p>
            <p className="text-muted-foreground text-sm mb-1.5">/ {pricing.period}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {isFree ? "No credit card required" : isINR ? "Billed monthly · Razorpay" : "Billed monthly · Stripe"}
        </p>
      </div>

      {/* Payment provider badge */}
      {!isFree && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-5 w-fit",
          isINR ? "bg-blue-500/8 border-blue-500/20" : "bg-violet-500/8 border-violet-500/20"
        )}>
          {isINR ? (
            <>
              <div className="w-4 h-4 rounded-sm bg-[#3395FF] flex items-center justify-center">
                <span className="text-[7px] text-white font-black">R</span>
              </div>
              <span className="text-[11px] text-blue-300 font-medium">Razorpay</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 rounded-sm bg-[#635BFF] flex items-center justify-center">
                <span className="text-[7px] text-white font-black">S</span>
              </div>
              <span className="text-[11px] text-violet-300 font-medium">Stripe</span>
            </>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/8 mb-5" />

      {/* Features */}
      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
            <Check className={cn("w-4 h-4 mt-0.5 shrink-0", isPro ? "text-primary" : "text-emerald-400")} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={onCheckout}
        className={cn(
          "mt-6 w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
          isFree
            ? "bg-white/8 border border-white/12 text-white hover:bg-white/12"
            : isPro
            ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:opacity-90 hover:scale-[1.02]"
            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:opacity-90 hover:scale-[1.02]"
        )}
      >
        {isFree ? "Get Started Free" : isINR ? "Pay with Razorpay →" : "Pay with Stripe →"}
      </button>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function PricingPage() {
  const [isINR, setIsINR] = useState(false);

  return (
    <div className="relative text-white overflow-x-hidden">
      {/* Background orbs — contained, not fixed */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl text-white mb-5 leading-tight">
            Invest in your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              relationships
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            One tool to manage every important connection in your life — contacts, follow-ups, AI insights, and more.
          </p>
        </motion.div>

        {/* Currency Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center mb-12"
        >
          <div className="relative flex items-center gap-1 p-1.5 rounded-2xl bg-card border border-border/60 shadow-lg">
            {/* Sliding pill */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-primary/15 border border-primary/25"
              animate={{ left: isINR ? "calc(50% + 2px)" : "6px", right: isINR ? "6px" : "calc(50% + 2px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />

            {/* USD button */}
            <button
              onClick={() => setIsINR(false)}
              className={cn(
                "relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 min-w-[140px] justify-center",
                !isINR ? "text-white" : "text-muted-foreground hover:text-white/70"
              )}
            >
              <span className="text-lg">🇺🇸</span>
              <div className="text-left">
                <p className="text-[11px] font-bold leading-none">USD</p>
                <p className="text-[10px] font-normal text-muted-foreground leading-none mt-0.5">via Stripe</p>
              </div>
              <div className="w-4 h-4 rounded-sm bg-[#635BFF] flex items-center justify-center ml-0.5">
                <span className="text-[7px] text-white font-black">S</span>
              </div>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-border/60 relative z-10" />

            {/* INR button */}
            <button
              onClick={() => setIsINR(true)}
              className={cn(
                "relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 min-w-[140px] justify-center",
                isINR ? "text-white" : "text-muted-foreground hover:text-white/70"
              )}
            >
              <span className="text-lg">🇮🇳</span>
              <div className="text-left">
                <p className="text-[11px] font-bold leading-none">INR</p>
                <p className="text-[10px] font-normal text-muted-foreground leading-none mt-0.5">via Razorpay</p>
              </div>
              <div className="w-4 h-4 rounded-sm bg-[#3395FF] flex items-center justify-center ml-0.5">
                <span className="text-[7px] text-white font-black">R</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Flip instruction hint */}
        <AnimatePresence>
          <motion.p
            key={isINR ? "inr" : "usd"}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-muted-foreground/60 -mt-6 mb-10 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Cards are showing prices in {isINR ? "₹ INR · Razorpay" : "$ USD · Stripe"} — flip to switch
          </motion.p>
        </AnimatePresence>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isINR={isINR}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-10 border-t border-border/30"
        >
          {[
            { icon: Shield, text: "256-bit SSL Encryption" },
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

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20"
        >
          <h2 className="font-display font-bold text-3xl text-center mb-10 text-white">
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "Can I switch between USD and INR?",
                a: "Yes — just use the toggle above. Stripe handles USD payments globally, while Razorpay is optimized for Indian bank accounts, UPI, and wallets."
              },
              {
                q: "Is my payment data secure?",
                a: "Absolutely. We never store card details. All payments are processed by Stripe (PCI DSS Level 1) or Razorpay (PCI DSS compliant)."
              },
              {
                q: "Can I cancel at any time?",
                a: "Yes — no contracts, no hidden fees. Cancel from your account settings and you won't be charged for the next billing cycle."
              },
              {
                q: "Do you offer a free trial?",
                a: "The Starter plan is permanently free with no credit card required. Pro and Enterprise plans include a 14-day money-back guarantee."
              },
              {
                q: "What payment methods are accepted?",
                a: "Stripe accepts all major credit/debit cards globally. Razorpay additionally supports UPI, Net Banking, Paytm, PhonePe, and EMI."
              },
              {
                q: "Is there a team or company plan?",
                a: "The Enterprise plan supports up to 10 team members with shared workspace, role permissions, and a dedicated account manager."
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-card border border-border/50 rounded-2xl p-5">
                <p className="font-semibold text-white text-sm mb-2">{q}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-20 p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
        >
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="font-display font-black text-3xl text-white mb-3">
            Start for free today
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            No credit card needed. Set up your entire contact network in under 5 minutes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup">
              <button className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:opacity-90 hover:scale-[1.02] transition-all">
                Get Started — It's Free
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
                Sign in →
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
