import React from "react";
import ConfirmationModal from "./components/admin/ConfirmationModal";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // window.location.reload(); // Simple retry by reloading the app
    if (window.electron) {
      window.electron.invoke("restart-app");
    }
  };

  render() {
    if (this.state.hasError) {
      // Render a warning modal when an error is caught
      return (
        <ConfirmationModal
          isOpen={true}
          data={{
            title: "Loading Error",
            message: "An error occurred while loading the application. Would you like to restart?",
            onConfirm: this.handleRetry,
            buttonLabel: "Restart",
          }}
          onCancel={() => window.close()} // Close app if the user cancels
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
