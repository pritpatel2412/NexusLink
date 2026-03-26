import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAiChat, type AiChatMessage } from "@workspace/api-client-react";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const SUGGESTED_PROMPTS = [
  "Brief me on my meetings today",
  "Who haven't I spoken to in 30 days?",
  "Draft a follow-up email",
  "Summarize last month's notes"
];

export default function AiAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: "assistant", content: "Hi! I'm NexusLink AI. I can help you prep for meetings, remember details about your contacts, or draft emails. What do you need?" }
  ]);
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
      setMessages([...updatedMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        
        <div className="px-6 py-4 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-white">NexusLink AI</h2>
              <p className="text-xs text-muted-foreground">gpt-4o-mini powered</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 z-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className="shrink-0 mt-1">
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                    {getInitials(user?.name)}
                  </div>
                )}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-accent text-white rounded-tr-sm' 
                  : 'bg-card border border-border/50 text-gray-200 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                {msg.role === 'assistant' && idx > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white"><Copy className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white"><ThumbsUp className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white"><ThumbsDown className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce delay-75" />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 sm:p-6 border-t border-border/50 bg-background/80 backdrop-blur z-10 shrink-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button 
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 hover:border-primary/50 text-muted-foreground hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..." 
              className="w-full pl-4 pr-12 h-14 rounded-2xl bg-card border-border/50 focus-visible:ring-primary/30 shadow-inner"
              disabled={isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-white transition-transform hover:scale-105"
              disabled={!input.trim() || isPending}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Context Panel */}
      <div className="w-80 hidden lg:flex flex-col bg-card/20 z-10">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-display font-semibold text-white mb-2">Context Context</h3>
          <Input placeholder="Search to attach contact..." className="bg-background/50 h-10 text-sm" />
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-muted-foreground text-center mt-10">Search a contact above to provide AI with specific history and notes.</p>
        </div>
      </div>
    </div>
  );
}
