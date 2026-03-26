import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Bot, Copy, ThumbsUp, ThumbsDown, Check,
  Wand2, ChevronDown, Mic, MicOff, Paperclip, X, FileText,
  Image as ImageIcon, AlertCircle
} from "lucide-react";
import { useAiChat, type AiChatMessage } from "@workspace/api-client-react";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { NetworkPulsePanel } from "@/components/ai/NetworkPulsePanel";
import { SmartSummarizer } from "@/components/ai/SmartSummarizer";
import { cn } from "@/lib/utils";

// ── Speech Recognition Setup ──────────────────────────────────────────
type SpeechRecognitionInstance = any;
const SpeechRecognitionAPI: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const SMART_PROMPTS = [
  { label: "Who to contact today?", icon: "📡", prompt: "Analyze my network and tell me exactly who I should reach out to today and why. Give me specific reasons and a suggested opening message for each." },
  { label: "Relationship health check", icon: "❤️", prompt: "Do a full relationship health check on my network. Which contacts are thriving, which are cooling, and which are at risk? What should I do about each?" },
  { label: "Weekly digest", icon: "📋", prompt: "Give me a weekly digest of my network. Summarize recent interactions, what's happened this week, and what I need to focus on next week." },
  { label: "Draft follow-up email", icon: "✉️", prompt: "Help me draft a warm, professional follow-up email to someone I met recently. Ask me for their name and context." },
  { label: "Find warm intros", icon: "🤝", prompt: "Look through my contacts and identify any warm introduction opportunities — people I know who should probably meet each other." },
  { label: "Meeting prep brief", icon: "📝", prompt: "I have a meeting coming up. Give me a full briefing — background, talking points, and key questions." },
];

interface AttachedFile {
  name: string;
  type: "text" | "image";
  content: string;
  preview?: string;
}

// ── Markdown Renderer ─────────────────────────────────────────────────
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="text-sm leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return <p key={i} className="font-bold text-white mt-3 mb-1 text-base">{line.replace(/^## /, "")}</p>;
        if (line.startsWith("### "))
          return <p key={i} className="font-semibold text-white/90 mt-2 mb-0.5">{line.replace(/^### /, "")}</p>;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-semibold text-white">{line.replace(/\*\*/g, "")}</p>;
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const inner = line.replace(/^[-*] /, "");
          const bold = inner.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: bold }} />
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const match = line.match(/^(\d+)\. (.+)/);
          if (match)
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary font-mono text-xs mt-0.5 shrink-0 w-4">{match[1]}.</span>
                <span>{match[2]}</span>
              </div>
            );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function AiAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm **NexusLink AI** — your elite relationship intelligence assistant.\n\nI have **full context of your entire network** — contacts, interactions, tasks, and reminders. Ask me anything:\n\n- **\"Who should I reach out to today?\"** — I'll analyze your whole network\n- **\"Draft a follow-up for [name]\"** — personalized emails\n- **\"What's my network health?\"** — relationship analytics\n- **\"Who haven't I talked to in 30 days?\"** — real data from your CRM\n\nYou can also 🎤 **speak** your message or 📎 **attach a file** for context.\n\nWhat do you need?",
    },
  ]);

  // Feedback state
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [likedIdxs, setLikedIdxs] = useState<Set<number>>(new Set());
  const [dislikedIdxs, setDislikedIdxs] = useState<Set<number>>(new Set());

  // Prompt state
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const micSupported = Boolean(SpeechRecognitionAPI);

  // File attachment state
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: sendMessage, isPending } = useAiChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && !attachedFile) || isPending) return;

    let fullContent = content;

    if (attachedFile) {
      if (attachedFile.type === "text") {
        fullContent = `${content || "Please analyze this file:"}\n\n📎 **Attached file: ${attachedFile.name}**\n\`\`\`\n${attachedFile.content.slice(0, 6000)}${attachedFile.content.length > 6000 ? "\n...[truncated]" : ""}\n\`\`\``;
      } else {
        fullContent = `${content || ""} [User attached image: ${attachedFile.name}]`.trim();
      }
    }

    const newMsg: AiChatMessage = { role: "user", content: fullContent };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    setAttachedFile(null);

    try {
      const response = await sendMessage({ data: { messages: updatedMessages } });
      setMessages([...updatedMessages, { role: "assistant", content: response.message }]);
    } catch {
      toast({ variant: "destructive", title: "Failed to connect to AI" });
      setMessages([...updatedMessages, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
      }]);
    }
  };

  // ── Copy ────────────────────────────────────────────────────────────
  const handleCopy = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
      toast({ title: "Copied to clipboard", description: "Message copied successfully." });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Could not access clipboard." });
    }
  };

  // ── Like / Dislike ──────────────────────────────────────────────────
  const handleLike = (idx: number) => {
    setLikedIdxs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        setDislikedIdxs(d => { const nd = new Set(d); nd.delete(idx); return nd; });
        toast({ title: "👍 Helpful!", description: "Glad that response was useful." });
      }
      return next;
    });
  };

  const handleDislike = (idx: number) => {
    setDislikedIdxs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        setLikedIdxs(d => { const nd = new Set(d); nd.delete(idx); return nd; });
        toast({ title: "👎 Feedback noted", description: "I'll try to do better next time." });
      }
      return next;
    });
  };

  // ── Microphone ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!micSupported) {
      toast({ variant: "destructive", title: "Mic not supported", description: "Your browser doesn't support voice input. Try Chrome or Edge." });
      return;
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final) {
        setInput(prev => (prev ? prev + " " + final : final).trim());
        setInterimText("");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsTranscribing(false);
      setInterimText("");
      recognitionRef.current = null;
      inputRef.current?.focus();
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setIsTranscribing(false);
      setInterimText("");
      recognitionRef.current = null;
      if (event.error !== "aborted" && event.error !== "no-speech") {
        toast({ variant: "destructive", title: "Voice input error", description: "Could not capture audio. Check microphone permissions." });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [micSupported, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      setIsTranscribing(true);
      recognitionRef.current.stop();
    }
  }, []);

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ── File Upload ─────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isText = file.type.startsWith("text/") ||
      /\.(json|md|csv|txt|log|yaml|yml|xml)$/i.test(file.name);

    if (!isImage && !isText) {
      toast({ variant: "destructive", title: "Unsupported file", description: "Please attach a text file (.txt, .csv, .json, .md) or an image." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 5 MB." });
      return;
    }

    try {
      if (isImage) {
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setAttachedFile({ name: file.name, type: "image", content: preview, preview });
      } else {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        setAttachedFile({ name: file.name, type: "text", content });
      }
      toast({ title: "File attached", description: `${file.name} ready to send.` });
    } catch {
      toast({ variant: "destructive", title: "Failed to read file" });
    }
  };

  const handlePulseContact = (name: string, action: string) => {
    handleSend(`I want to reach out to ${name}. ${action}. Help me draft a personalized message or email for this.`);
  };

  const visiblePrompts = showAllPrompts ? SMART_PROMPTS : SMART_PROMPTS.slice(0, 3);

  return (
    <div className="h-full flex flex-col md:flex-row bg-background overflow-hidden">
      {/* ── Main Chat Area ── */}
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
                  <div className="flex items-center gap-0.5 mt-3 pt-2.5 border-t border-border/30">
                    {/* Copy */}
                    <button
                      title="Copy response"
                      onClick={() => handleCopy(msg.content, idx)}
                      className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                        copiedIdx === idx
                          ? "text-green-400 bg-green-400/10"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      {copiedIdx === idx
                        ? <Check className="w-3.5 h-3.5" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Like */}
                    <button
                      title="Helpful"
                      onClick={() => handleLike(idx)}
                      className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                        likedIdxs.has(idx)
                          ? "text-green-400 bg-green-400/15"
                          : "text-muted-foreground hover:text-green-400 hover:bg-green-400/8"
                      )}
                    >
                      <ThumbsUp className={cn("w-3.5 h-3.5", likedIdxs.has(idx) && "fill-green-400")} />
                    </button>

                    {/* Dislike */}
                    <button
                      title="Not helpful"
                      onClick={() => handleDislike(idx)}
                      className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                        dislikedIdxs.has(idx)
                          ? "text-red-400 bg-red-400/15"
                          : "text-muted-foreground hover:text-red-400 hover:bg-red-400/8"
                      )}
                    >
                      <ThumbsDown className={cn("w-3.5 h-3.5", dislikedIdxs.has(idx) && "fill-red-400")} />
                    </button>

                    <div className="ml-auto text-[10px] text-muted-foreground/40">
                      {likedIdxs.has(idx) && "Marked helpful"}
                      {dislikedIdxs.has(idx) && "Feedback sent"}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[90%]">
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
          {/* Smart prompt chips */}
          <div className="mb-3 flex flex-wrap gap-2">
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

          {/* Attached file preview */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/20 w-fit max-w-full">
                  {attachedFile.type === "image" ? (
                    <>
                      <img src={attachedFile.preview} alt={attachedFile.name} className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" />
                      <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    </>
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                  <span className="text-xs text-white font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="text-muted-foreground hover:text-white transition-colors shrink-0 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice interim text */}
          <AnimatePresence>
            {(isListening || interimText) && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20"
              >
                <div className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 h-4 rounded-full bg-red-400"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-red-300">
                  {isTranscribing ? "Processing..." : interimText || "Listening... Speak now"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json,.md,.log,.yaml,.yml,.xml,image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Attach button */}
            <button
              type="button"
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                attachedFile
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-white hover:border-white/20"
              )}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Listening..." : attachedFile ? `Message about ${attachedFile.name}...` : "Ask anything about your network..."}
                className={cn(
                  "w-full h-12 px-4 rounded-2xl bg-card border text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors",
                  isListening ? "border-red-500/40 bg-red-500/5" : "border-border/50"
                )}
                disabled={isPending}
              />
            </div>

            {/* Mic button */}
            {micSupported ? (
              <button
                type="button"
                title={isListening ? "Stop recording" : "Voice input"}
                onClick={toggleMic}
                disabled={isPending || isTranscribing}
                className={cn(
                  "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                  isListening
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                    : isTranscribing
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-white hover:border-white/20"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            ) : (
              <div title="Voice input not supported in this browser" className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-card border border-border/50 text-muted-foreground/30 cursor-not-allowed">
                <Mic className="w-4 h-4" />
              </div>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || isPending}
              className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>

          {!micSupported && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <AlertCircle className="w-2.5 h-2.5" />
              Voice input requires Chrome, Edge, or Safari.
            </p>
          )}
        </div>
      </div>

      {/* Right Panel — Network Pulse */}
      <div className="w-80 hidden lg:flex flex-col bg-card/20 border-l border-border/50 z-10">
        <NetworkPulsePanel onContactSelect={handlePulseContact} />
      </div>
    </div>
  );
}
