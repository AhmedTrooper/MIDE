import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#242424] text-white p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Something went wrong
          </h2>
          <p className="text-zinc-400 mb-6 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-4">
            <Button variant="default" onClick={this.handleReload}>
              Reload Application
            </Button>
            <a href={"/"}>Home</a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
