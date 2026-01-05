import { Result, Button } from 'antd';
import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * ErrorBoundaryProps - Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Fallback UI to render when error occurs */
  fallback?: ReactNode;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * ErrorBoundaryState - State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary - React Error Boundary component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Features:
 * - Catches errors during rendering, in lifecycle methods, and in constructors
 * - Logs error details to console for debugging
 * - Provides user-friendly error fallback UI
 * - "Try again" button to reset error state and re-render
 * - Optional custom error handler callback
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     console.error('Error caught by boundary:', error, errorInfo);
 *   }}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              this.state.error?.message || 'An unexpected error occurred. Please try again.'
            }
            extra={[
              <Button type="primary" key="retry" onClick={this.handleReset}>
                Try Again
              </Button>,
              <Button key="reload" onClick={() => window.location.reload()}>
                Reload Page
              </Button>,
            ]}
            style={{
              background: 'var(--color-card-bg)',
              padding: '2rem',
              borderRadius: '12px',
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorBoundaryFallback - Standalone fallback component
 *
 * Can be used as a custom fallback for ErrorBoundary
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export function ErrorBoundaryFallback(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Result
        status="error"
        title="Something went wrong"
        subTitle="An unexpected error occurred. Please try again."
        extra={[
          <Button type="primary" key="reload" onClick={() => window.location.reload()}>
            Reload Page
          </Button>,
        ]}
        style={{
          background: 'var(--color-card-bg)',
          padding: '2rem',
          borderRadius: '12px',
        }}
      />
    </div>
  );
}

/**
 * withErrorBoundary - Higher-order component that wraps a component with ErrorBoundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent);
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
