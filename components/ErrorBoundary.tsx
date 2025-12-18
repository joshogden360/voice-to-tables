import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches React errors and shows a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-white p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/60 p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-3">
                Something went wrong
              </h1>
              
              <p className="text-sm text-slate-600 mb-8 font-light">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <RefreshCw size={18} />
                Reload Application
              </button>
              
              <p className="text-xs text-slate-400 mt-6 font-light">
                If this problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

