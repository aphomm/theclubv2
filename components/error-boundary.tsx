'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="text-5xl font-light text-amber-600 mb-6">!</div>
            <h1 className="text-2xl font-light mb-4">Something went wrong</h1>
            <p className="text-stone-400 font-light mb-8 text-sm">
              An unexpected error occurred. Try refreshing — if it keeps happening, contact{' '}
              <a href="mailto:support@icwt.com" className="text-amber-600 hover:underline">
                support@icwt.com
              </a>
            </p>
            <button
              onClick={this.handleRetry}
              className="border border-amber-600 text-amber-600 px-8 py-3 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors"
            >
              Try Refreshing
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
