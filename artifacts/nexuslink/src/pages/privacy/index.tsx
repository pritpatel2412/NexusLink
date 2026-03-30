import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Shield, ArrowLeft, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: [
      {
        sub: "Account Information",
        text: "When you register, we collect your name, email address, and a hashed password. We never store your password in plain text.",
      },
      {
        sub: "Contact & CRM Data",
        text: "All contacts, interaction notes, tasks, reminders, and relationship data you enter into NexusLink are stored securely in your account and are not shared with any third party.",
      },
      {
        sub: "Usage Data",
        text: "We collect anonymised usage analytics (pages visited, features used, session duration) to improve product quality. This data cannot be used to identify you personally.",
      },
      {
        sub: "Payment Data",
        text: "Payments are processed by Stripe (USD) or Razorpay (INR). We never store your card number, CVV, or banking credentials. We only receive a payment confirmation token from the payment processor.",
      },
      {
        sub: "AI Interactions",
        text: "When you use the AI Assistant, your messages and relevant CRM context are sent to our AI provider (OpenAI via Replit AI Integrations proxy) to generate responses. We do not use your conversations to train AI models.",
      },
    ],
  },
  {
    id: "how-we-use-information",
    title: "2. How We Use Your Information",
    content: [
      { sub: "Service Delivery", text: "To operate and personalise your NexusLink account, including AI-powered features, contact management, task tracking, and reminders." },
      { sub: "Communications", text: "To send transactional emails (account confirmation, password reset). We do not send marketing emails without your explicit consent." },
      { sub: "Security", text: "To detect and prevent fraud, abuse, and unauthorised access to your account." },
      { sub: "Product Improvement", text: "Aggregated, anonymised usage data is used to prioritise feature development and fix bugs. No personally identifiable information is used for this purpose." },
    ],
  },
  {
    id: "data-sharing",
    title: "3. Data Sharing & Third Parties",
    content: [
      { sub: "We Never Sell Your Data", text: "Your personal data and CRM data are never sold, rented, or shared with advertisers or data brokers under any circumstances." },
      { sub: "Service Providers", text: "We work with a limited number of trusted service providers: Stripe & Razorpay (payment processing), OpenAI via Replit (AI features), and our hosting infrastructure. Each provider is bound by data processing agreements." },
      { sub: "Legal Requirements", text: "We may disclose information if required by law, court order, or to protect the rights and safety of our users and the public." },
    ],
  },
  {
    id: "data-retention",
    title: "4. Data Retention",
    content: [
      { sub: "Active Accounts", text: "Your data is retained for as long as your account is active and for a reasonable period thereafter to support account recovery." },
      { sub: "Deletion", text: "You may request full deletion of your account and all associated data at any time by contacting us at privacy@nexuslink.app. We will process deletion within 30 days." },
      { sub: "Backups", text: "Deleted data may remain in encrypted backups for up to 90 days before being permanently purged." },
    ],
  },
  {
    id: "your-rights",
    title: "5. Your Rights",
    content: [
      { sub: "Access", text: "You may request a full export of your personal data and CRM data at any time via Settings → Export." },
      { sub: "Correction", text: "You may update your account information at any time via the Settings page." },
      { sub: "Portability", text: "Your contacts and interactions can be exported as CSV from the app at any time." },
      { sub: "GDPR (EU/EEA users)", text: "If you are located in the EU or EEA, you have the right to access, rectify, erase, restrict, or object to the processing of your personal data. Contact us at privacy@nexuslink.app to exercise these rights." },
      { sub: "CCPA (California residents)", text: "California residents have the right to know what personal information is collected and to request deletion. We do not sell personal information." },
    ],
  },
  {
    id: "security",
    title: "6. Security",
    content: [
      { sub: "Encryption", text: "All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption." },
      { sub: "Authentication", text: "Passwords are hashed using bcrypt. We support secure session management with HTTP-only JWT tokens." },
      { sub: "Infrastructure", text: "Our infrastructure is hosted on Replit with automatic security patches and monitoring." },
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies",
    content: [
      { sub: "Essential Cookies", text: "We use session cookies necessary for authentication and to keep you logged in. These cannot be disabled without breaking the service." },
      { sub: "Analytics", text: "We use privacy-first analytics that do not use third-party tracking cookies or fingerprinting." },
      { sub: "No Ad Tracking", text: "We do not use advertising cookies, retargeting pixels, or any form of cross-site tracking." },
    ],
  },
  {
    id: "changes",
    title: "8. Changes to This Policy",
    content: [
      { sub: "Notification", text: "We will notify you of material changes to this Privacy Policy via email or an in-app notification at least 14 days before changes take effect." },
      { sub: "Continued Use", text: "Continued use of NexusLink after the effective date of a revised policy constitutes acceptance of the updated terms." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[120px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary">Legal</span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Your data belongs to you. This policy explains exactly what we collect, why we collect it, and how you can control it.
          </p>
          <div className="flex items-center gap-4 mt-5 text-sm text-muted-foreground">
            <span>Effective date: <strong className="text-white">1 March 2026</strong></span>
            <span>·</span>
            <span>Last updated: <strong className="text-white">26 March 2026</strong></span>
          </div>
        </motion.div>

        {/* Table of contents */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-12"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Contents</p>
          <ul className="space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Sections */}
        <div className="space-y-14">
          {SECTIONS.map((section, si) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * si }}
            >
              <h2 className="font-display font-bold text-2xl text-white mb-6 pb-3 border-b border-border/50">
                {section.title}
              </h2>
              <div className="space-y-5">
                {section.content.map((item) => (
                  <div key={item.sub}>
                    <h3 className="font-semibold text-white mb-1.5">{item.sub}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/8 border border-primary/20 text-center"
        >
          <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white mb-2">Questions about your data?</h3>
          <p className="text-muted-foreground text-sm mb-5">Our privacy team responds within 48 hours.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/contact">
              <button className="px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all text-sm font-medium">
                Contact Us
              </button>
            </Link>
            <a href="mailto:privacy@nexuslink.app" className="text-sm text-muted-foreground hover:text-white transition-colors">
              privacy@nexuslink.app
            </a>
          </div>
        </motion.div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-border/30 flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
          <span>© 2026 NexusLink. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
        </div>
      </div>
    </div>
  );
}
