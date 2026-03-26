import { Link } from "wouter";
import { Sparkles, BrainCircuit, Zap, ArrowRight, CheckCircle2, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30 relative">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10"></div>
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Abstract dark theme background" 
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <header className="relative z-20 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-white">NexusLink</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/10 hidden sm:flex">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95">
              Start Free
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-20">
        <section className="pt-32 pb-40 px-6 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              <span>Introducing AI Memory Assistant</span>
            </div>
            
            <h1 className="font-display text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1] text-white">
              Your Second Brain for <br />
              <span className="text-gradient">Every Relationship</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              NexusLink remembers every conversation, interaction, and follow-up so you can focus on building meaningful connections.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full text-lg font-semibold shadow-[0_0_40px_rgba(108,99,255,0.3)] transition-all hover:scale-105">
                  Start for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg font-medium border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md">
                See How It Works
              </Button>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 14-day free trial</div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="py-24 bg-card/40 border-y border-white/5 backdrop-blur-xl">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Capture in Seconds", desc: "Log interactions with a single click. Keep your CRM updated without the friction of traditional tools." },
                { icon: BrainCircuit, title: "AI-Powered Memory", desc: "Get instant AI briefs before your meetings. NexusLink synthesizes past context into actionable talking points." },
                { icon: CheckSquare, title: "Never Miss a Follow-Up", desc: "Intelligent reminders and automated task tracking ensure you always stay top of mind with your network." }
              ].map((feat, i) => (
                <div key={i} className="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                    <feat.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-4">{feat.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
