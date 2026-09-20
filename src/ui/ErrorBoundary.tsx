import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onResetToMainMenu?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Bappa Rush Error Boundary caught an error:', error, errorInfo);
  }

  public handleRecovery = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onResetToMainMenu) {
      this.props.onResetToMainMenu();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="screen-error-recovery"
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-b from-[#180b2c] via-[#120724] to-[#0a0314] text-white select-none"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-indigo-950/90 border-2 border-rose-500/60 p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl mb-4 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 id="error-title" className="text-2xl font-black text-amber-200">
              Festival Hiccup!
            </h2>
            <p id="error-message" className="text-sm text-amber-100/80 mt-2 mb-6 leading-relaxed">
              Something unexpected happened while preparing the festival pandal. Don't worry, your high scores and progress are safe!
            </p>

            <button
              id="btn-error-return-menu"
              onClick={this.handleRecovery}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Main Menu</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
