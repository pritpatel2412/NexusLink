import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, FileText, ArrowLeft, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: [
      {
        sub: "Agreement",
        text: "By creating a NexusLink account or using any part of our service, you agree to be bound by these Terms of Service ('Terms'). If you do not agree, you must not use the service.",
      },
      {
        sub: "Eligibility",
        text: "You must be at least 16 years of age to use NexusLink. By using the service, you represent that you meet this requirement.",
      },
      {
        sub: "Updates",
        text: "We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least 14 days in advance. Continued use after the effective date constitutes acceptance.",
      },
    ],
  },
  {
    id: "service-description",
    title: "2. Description of Service",
    content: [
      {
        sub: "What NexusLink Provides",
        text: "NexusLink is a personal CRM and AI relationship intelligence platform designed for founders, freelancers, and creators. It includes contact management, interaction tracking, task and reminder management, AI-powered insights, network analytics, and related features.",
      },
      {
        sub: "Service Availability",
        text: "We strive for high availability but do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance, updates, or due to factors beyond our control.",
      },
      {
        sub: "Beta Features",
        text: "Some features may be released in beta and may have reduced reliability or change significantly. Beta features will be clearly labelled.",
      },
    ],
  },
  {
    id: "accounts",
    title: "3. Accounts & Registration",
    content: [
      {
        sub: "Account Security",
        text: "You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately at security@nexuslink.app if you suspect any unauthorised access to your account.",
      },
      {
        sub: "Accurate Information",
        text: "You agree to provide accurate, current, and complete information during registration and to keep your account information updated.",
      },
      {
        sub: "One Account Per Person",
        text: "Each person may maintain only one free account. Creating multiple accounts to circumvent plan limitations is a violation of these Terms and may result in account suspension.",
      },
    ],
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    content: [
      {
        sub: "Permitted Use",
        text: "You may use NexusLink solely for lawful personal and professional relationship management purposes, in accordance with these Terms and applicable laws.",
      },
      {
        sub: "Prohibited Activities",
        text: "You must not: (a) use the service to harass, stalk, or harm any individual; (b) upload unlawful, defamatory, or malicious content; (c) attempt to reverse engineer or extract our AI models or proprietary algorithms; (d) use automated tools to scrape or bulk-extract data; (e) resell or sublicense the service without written permission; (f) violate any applicable law or regulation.",
      },
      {
        sub: "AI Usage",
        text: "The AI features are intended for relationship intelligence and productivity purposes. You must not use them to generate harmful, deceptive, or illegal content. You are responsible for reviewing and verifying any AI-generated output before acting on it.",
      },
    ],
  },
  {
    id: "payment",
    title: "5. Payment & Subscriptions",
    content: [
      {
        sub: "Billing",
        text: "Paid plans are billed monthly in advance. USD payments are processed by Stripe; INR payments are processed by Razorpay. By subscribing, you authorise the applicable payment processor to charge your payment method on a recurring basis.",
      },
      {
        sub: "Free Plan",
        text: "The Starter plan is permanently free with no credit card required, subject to the usage limits described on our Pricing page.",
      },
      {
        sub: "Cancellation",
        text: "You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time within a billing period.",
      },
      {
        sub: "Price Changes",
        text: "We reserve the right to change our pricing at any time. Existing subscribers will receive at least 30 days' notice before any price increase takes effect.",
      },
      {
        sub: "Money-Back Guarantee",
        text: "If you are unsatisfied within the first 14 days of a paid subscription, contact us at billing@nexuslink.app for a full refund.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "6. Intellectual Property",
    content: [
      {
        sub: "NexusLink IP",
        text: "All software, designs, branding, AI models, and features of NexusLink are the exclusive property of NexusLink and are protected by copyright, trademark, and other intellectual property laws.",
      },
      {
        sub: "Your Data",
        text: "You retain full ownership of all data you enter into NexusLink, including your contacts, notes, and interactions. You grant us a limited licence to process and store this data solely to provide the service.",
      },
      {
        sub: "Feedback",
        text: "If you submit feedback, suggestions, or ideas, you grant us a perpetual, royalty-free licence to use them without obligation to you.",
      },
    ],
  },
  {
    id: "privacy",
    title: "7. Privacy",
    content: [
      {
        sub: "Privacy Policy",
        text: "Your use of NexusLink is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the service, you consent to the data practices described in our Privacy Policy.",
      },
    ],
  },
  {
    id: "disclaimers",
    title: "8. Disclaimers & Limitation of Liability",
    content: [
      {
        sub: "No Warranty",
        text: "NexusLink is provided 'as is' and 'as available', without warranties of any kind, express or implied, including but not limited to fitness for a particular purpose or non-infringement.",
      },
      {
        sub: "AI Accuracy",
        text: "AI-generated content (briefs, scores, summaries, emails) may be inaccurate, incomplete, or inappropriate. You are solely responsible for reviewing and verifying AI output before relying on it for any business or personal decision.",
      },
      {
        sub: "Limitation of Liability",
        text: "To the maximum extent permitted by law, NexusLink's aggregate liability to you for any claim arising from your use of the service shall not exceed the amount you paid in the 12 months preceding the claim.",
      },
      {
        sub: "Consequential Damages",
        text: "In no event will NexusLink be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.",
      },
    ],
  },
  {
    id: "termination",
    title: "9. Termination",
    content: [
      {
        sub: "By You",
        text: "You may terminate your account at any time by going to Settings → Delete Account. Upon termination, your data will be deleted in accordance with our Privacy Policy.",
      },
      {
        sub: "By Us",
        text: "We may suspend or terminate your account immediately and without notice if you violate these Terms, engage in fraudulent activity, or if required by law.",
      },
      {
        sub: "Effect of Termination",
        text: "Upon termination, your right to access the service ceases immediately. Provisions of these Terms that by their nature should survive termination will do so.",
      },
    ],
  },
  {
    id: "governing-law",
    title: "10. Governing Law & Disputes",
    content: [
      {
        sub: "Governing Law",
        text: "These Terms shall be governed by and construed in accordance with the laws applicable to the jurisdiction in which NexusLink operates, without regard to conflict of law principles.",
      },
      {
        sub: "Dispute Resolution",
        text: "We encourage you to contact us first at legal@nexuslink.app to resolve any disputes informally. If a dispute cannot be resolved informally, it shall be submitted to binding arbitration.",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/6 blur-[120px]" />
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
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium text-accent">Legal</span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            These Terms govern your use of NexusLink. Please read them carefully — they contain important information about your rights and obligations.
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
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group"
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
          className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/8 border border-accent/20 text-center"
        >
          <FileText className="w-8 h-8 text-accent mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white mb-2">Questions about these terms?</h3>
          <p className="text-muted-foreground text-sm mb-5">Our team will clarify anything you're unsure about.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/contact">
              <button className="px-6 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all text-sm font-medium">
                Contact Us
              </button>
            </Link>
            <a href="mailto:legal@nexuslink.app" className="text-sm text-muted-foreground hover:text-white transition-colors">
              legal@nexuslink.app
            </a>
          </div>
        </motion.div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-border/30 flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
          <span>© 2026 NexusLink. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
