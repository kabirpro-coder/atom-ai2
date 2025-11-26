import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans text-white">
          <div className="max-w-md w-full bg-[#151B2B] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-xl font-bold">Something went wrong</h1>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">
              Atom AI encountered a critical error. Please copy the message below to fix it.
            </p>

            <div className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-auto max-h-48 mb-6">
              <code className="text-red-300 text-xs font-mono break-all">
                {this.state.error?.toString() || "Unknown Error"}
              </code>
            </div>

            <button 
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(regs => {
                    for(let reg of regs) reg.unregister();
                  });
                }
                window.location.reload();
              }}
              className="w-full py-3 bg-atom-600 hover:bg-atom-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Hard Refresh & Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;