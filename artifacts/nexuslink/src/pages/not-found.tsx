import { Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <img 
        src={`${import.meta.env.BASE_URL}images/not-found.png`}
        alt="404 Not Found"
        className="w-64 h-64 object-cover mb-8 rounded-3xl opacity-80"
      />
      <h1 className="font-display text-5xl font-bold text-white mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8 text-center max-w-md">
        The page or contact you're looking for has drifted into the void.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl border-white/10 hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
        <Link href="/dashboard">
          <Button className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
