import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not send reset email.");
      }
      setSentEmail(values.email);
      setSent(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message || "Could not send reset email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-2xl tracking-tight text-white">NexusLink</span>
      </Link>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {!sent ? (
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6 mx-auto">
              <Mail className="w-7 h-7 text-primary" />
            </div>

            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-white mb-2">Forgot password?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No worries — enter your email and we'll send you a secure reset link.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          className="bg-background/50 border-white/10 h-12 rounded-xl focus-visible:ring-primary/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-base mt-2 shadow-lg shadow-primary/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 mb-6 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>

            <h1 className="font-display text-2xl font-bold text-white mb-3">Check your inbox</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              We sent a password reset link to
            </p>
            <p className="font-semibold text-primary mb-6 text-sm break-all">{sentEmail}</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">⏱</span>
                <span>The link expires in <strong className="text-white">1 hour</strong>.</span>
              </p>
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">📂</span>
                <span>Can't find it? Check your <strong className="text-white">spam or junk folder</strong>.</span>
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-white/10 text-muted-foreground hover:text-white hover:border-white/20 mb-4"
              onClick={() => { setSent(false); form.reset(); }}
            >
              Try a different email
            </Button>

            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
