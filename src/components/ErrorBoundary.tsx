import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const IS_DEV = import.meta.env.DEV;
const LAST_ERROR_KEY = 'eldsm:last_error_v1';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Always log (helps in prod too)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Persist the last error for easier debugging across refreshes
    try {
      sessionStorage.setItem(
        LAST_ERROR_KEY,
        JSON.stringify({
          message: error?.message || String(error),
          stack: error?.stack || null,
          componentStack: errorInfo?.componentStack || null,
          time: Date.now(),
        })
      );
    } catch {
      // ignore storage failures
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.hash = '/';
    this.handleReset();
  };

  handleCopyDetails = async (): Promise<void> => {
    const payload = this.getErrorPayload();
    if (!payload) return;

    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: best-effort prompt
      window.prompt('Copy error details:', text);
    }
  };

  private getErrorPayload():
    | { message: string; stack: string | null; componentStack: string | null; time: number }
    | null {
    // Prefer current error; otherwise show last stored error
    if (this.state.error) {
      return {
        message: this.state.error.message || String(this.state.error),
        stack: this.state.error.stack || null,
        componentStack: this.state.errorInfo?.componentStack || null,
        time: Date.now(),
      };
    }

    try {
      const raw = sessionStorage.getItem(LAST_ERROR_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const payload = this.getErrorPayload();

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                An unexpected error occurred. Please try refreshing the page or go back to the home page.
              </p>

              {payload?.message && (
                <details className="bg-muted p-3 rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details{IS_DEV ? '' : ' (for debugging)'}
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground overflow-auto max-h-56">
{payload.message}

{IS_DEV && payload.stack ? payload.stack : ''}

{IS_DEV && payload.componentStack ? payload.componentStack : ''}
                  </pre>
                </details>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                {payload && (
                  <Button onClick={this.handleCopyDetails} variant="secondary">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

