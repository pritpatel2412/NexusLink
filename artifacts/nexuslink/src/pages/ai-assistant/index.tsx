import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, Copy, ThumbsUp, ThumbsDown, Check, Wand2, Command, ChevronDown } from "lucide-react";
import { useAiChat, type AiChatMessage, useListContacts } from "@workspace/api-client-react";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { NetworkPulsePanel } from "@/components/ai/NetworkPulsePanel";
import { SmartSummarizer } from "@/components/ai/SmartSummarizer";
import { cn } from "@/lib/utils";

const SMART_PROMPTS = [
  { label: "Who to contact today?", icon: "📡", prompt: "Analyze my network and tell me exactly who I should reach out to today and why. Give me specific reasons and a suggested opening message for each." },
  { label: "Relationship health check", icon: "❤️", prompt: "Do a full relationship health check on my network. Which contacts are thriving, which are cooling, and which are at risk? What should I do about each?" },
  { label: "Weekly digest", icon: "📋", prompt: "Give me a weekly digest of my network. Summarize recent interactions, what's happened this week, and what I need to focus on next week." },
  { label: "Draft follow-up email", icon: "✉️", prompt: "Help me draft a warm, professional follow-up email to someone I met recently. Ask me for their name and context." },
  { label: "Find warm intro opportunities", icon: "🤝", prompt: "Look through my contacts and identify any warm introduction opportunities — people I know who should probably meet each other." },
  { label: "Meeting prep brief", icon: "📝", prompt: "I have a meeting coming up. Which contact should I prep for? Give me a full briefing including background, talking points, and key questions." },
];

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="text-sm leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <p key={i} className="font-bold text-white mt-3 mb-1 text-base">{line.replace(/^## /, "")}</p>;
        }
        if (line.startsWith("### ")) {
          return <p key={i} className="font-semibold text-white/90 mt-2 mb-0.5">{line.replace(/^### /, "")}</p>;
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold text-white">{line.replace(/\*\*/g, "")}</p>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const inner = line.replace(/^[-*] /, "");
          const boldParsed = inner.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
          return <div key={i} className="flex items-start gap-2"><span className="text-primary mt-1 shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: boldParsed }} /></div>;
        }
        if (/^\d+\. /.test(line)) {
          const match = line.match(/^(\d+)\. (.+)/);
          if (match) {
            return <div key={i} className="flex items-start gap-2"><span className="text-primary font-mono text-xs mt-0.5 shrink-0 w-4">{match[1]}.</span><span>{match[2]}</span></div>;
          }
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const withBold = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: withBold }} />;
      })}
    </div>
  );
}

export default function AiAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm **NexusLink AI** — your elite relationship intelligence assistant.\n\nI have **full context of your entire network** — contacts, interactions, tasks, and reminders. Ask me anything:\n\n- **\"Who should I reach out to today?\"** — I'll analyze your whole network\n- **\"Draft a follow-up for [name]\"** — personalized emails\n- **\"What's my network health?\"** — relationship analytics\n- **\"Who haven't I talked to in 30 days?\"** — real data from your CRM\n\nWhat do you need?"
    }
  ]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: sendMessage, isPending } = useAiChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isPending) return;

    const newMsg: AiChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");

    try {
      const response = await sendMessage({
        data: { messages: updatedMessages }
      });
      setMessages([...updatedMessages, { role: "assistant", content: response.message }]);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to connect to AI" });
      setMessages([...updatedMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    }
  };

  const copyMessage = async (content: string, idx: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handlePulseContact = (name: string, action: string) => {
    handleSend(`I want to reach out to ${name}. ${action}. Help me draft a personalized message or email for this.`);
  };

  const visiblePrompts = showAllPrompts ? SMART_PROMPTS : SMART_PROMPTS.slice(0, 3);

  return (
    <div className="h-full flex flex-col md:flex-row bg-background overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border/50 relative min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">NexusLink AI</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs text-muted-foreground">Full CRM Context · GPT-4o-mini</p>
              </div>
            </div>
          </div>
          <SmartSummarizer />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 z-10">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "ml-auto flex-row-reverse max-w-[85%]" : "max-w-[90%]"}`}
            >
              <div className="shrink-0 mt-1">
                {msg.role === "assistant" ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                    {getInitials(user?.name)}
                  </div>
                )}
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl shadow-sm",
                msg.role === "user"
                  ? "bg-gradient-to-br from-primary to-accent text-white rounded-tr-sm"
                  : "bg-card border border-border/50 text-gray-200 rounded-tl-sm"
              )}>
                {msg.role === "assistant" ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === "assistant" && idx > 0 && (
                  <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-border/30">
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-white rounded-lg"
                      onClick={() => copyMessage(msg.content, idx)}
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-green-400 rounded-lg">
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400 rounded-lg">
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 max-w-[90%]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="px-4 py-4 rounded-2xl bg-card border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                {[0, 75, 150].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/60"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 sm:p-5 border-t border-border/50 bg-background/80 backdrop-blur z-10 shrink-0">
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {visiblePrompts.map((prompt) => (
                  <motion.button
                    key={prompt.label}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleSend(prompt.prompt)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-white transition-all disabled:opacity-40"
                  >
                    <span>{prompt.icon}</span>
                    {prompt.label}
                  </motion.button>
                ))}
              </AnimatePresence>
              <button
                onClick={() => setShowAllPrompts(!showAllPrompts)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronDown className={cn("w-3 h-3 transition-transform", showAllPrompts && "rotate-180")} />
                {showAllPrompts ? "Less" : "More"}
              </button>
            </div>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <div className="absolute left-4 text-muted-foreground/40">
              <Command className="w-4 h-4" />
            </div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your network..."
              className="w-full pl-10 pr-14 h-14 rounded-2xl bg-card border-border/50 focus-visible:ring-primary/30 shadow-inner text-sm"
              disabled={isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105"
              disabled={!input.trim() || isPending}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel — Network Pulse */}
      <div className="w-80 hidden lg:flex flex-col bg-card/20 border-l border-border/50 z-10">
        <NetworkPulsePanel onContactSelect={handlePulseContact} />
      </div>
    </div>
  );
}
