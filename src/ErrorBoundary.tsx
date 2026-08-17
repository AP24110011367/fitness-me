import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  resetAndReload = () => {
    try {
      localStorage.clear();
    } catch {
      // localStorage unavailable — ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          color: "#171A1F",
          background: "#F6F7F9",
        }}
      >
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Something went wrong</h1>
        <p style={{ color: "#6B7280", marginBottom: "20px", maxWidth: "360px" }}>
          The app hit an unexpected error and couldn't continue. Reloading usually fixes it — if it
          keeps happening, resetting your saved data should help.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #E8EAED",
              background: "#FFFFFF",
              color: "#171A1F",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={this.resetAndReload}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "#1F7A5C",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Reset data & reload
          </button>
        </div>
      </div>
    );
  }
}
