import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[NexusLink] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white font-display">Something went wrong</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                An unexpected error occurred. Your data is safe — try refreshing the page.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-white transition-colors">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                Try again
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
