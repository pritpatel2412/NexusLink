import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Github, Monitor, FileText, Video, ExternalLink, Sparkles } from "lucide-react";

interface WorkArtifact {
  id: string;
  title: string;
  description: string | null;
  type: string;
  artifactUrl: string;
  metrics: string | null;
  skills: string | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

export default function PublicPortfolioPage() {
  const [, params] = useRoute("/portfolio/public/:userId");
  const userId = params?.userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artifacts, setArtifacts] = useState<WorkArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchPublicData();
    }
  }, [userId]);

  const fetchPublicData = async () => {
    try {
      const res = await fetch(`/api/portfolio/public/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setArtifacts(data.artifacts);
      } else {
        setError("Portfolio not found or unavailable.");
      }
    } catch (err) {
      setError("Unable to load portfolio.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-foreground flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-lg">Querying Developer Pulse...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-foreground flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="text-destructive font-bold text-xl">404 Portfolio Not Found</div>
          <p className="text-muted-foreground max-w-sm">The requested public proof-of-work arsenal does not exist or was disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-gradient from-[#111122] via-[#0A0A0F] to-[#050508] text-foreground px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Public Header */}
        <div className="text-center space-y-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Portfolio</span>
          </div>

          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            {profile.name || "Talented Developer"}'s Arsenal
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Live technical deployments and certified proof-of-work metrics. No resumes, no fluff.
          </p>
        </div>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {artifacts.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-card/10 border border-white/5 rounded-2xl text-muted-foreground">
              This developer hasn't added any public proof of work cards yet.
            </div>
          ) : (
            artifacts.map((art) => (
              <div 
                key={art.id} 
                className="bg-card/25 border border-white/5 hover:border-primary/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 border border-white/5">
                      {art.type === "github" && <Github className="w-5 h-5 text-gray-300" />}
                      {art.type === "figma" && <FileText className="w-5 h-5 text-pink-400" />}
                      {art.type === "deploy" && <Monitor className="w-5 h-5 text-green-400" />}
                      {art.type === "video" && <Video className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white tracking-tight">{art.title}</h3>
                      <span className="text-[10px] text-muted-foreground capitalize">{art.type} Asset</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {art.description}
                  </p>

                  {/* Outcome Metrics */}
                  {art.metrics && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {art.metrics.split(",").map((m, i) => (
                        <span key={i} className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10">
                          {m.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {art.skills && JSON.parse(art.skills).map((s: string, idx: number) => (
                      <span key={idx} className="text-[9px] bg-secondary/50 text-gray-400 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>

                  <a 
                    href={art.artifactUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:text-accent font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>View Live Deploy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer Contact Details */}
        <div className="text-center border-t border-white/5 pt-12 text-xs text-muted-foreground">
          Powered securely by <span className="text-primary font-semibold">NexusLink</span> • Verified Cryptographic Credentials
        </div>

      </div>
    </div>
  );
}
