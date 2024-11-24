import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./App.css";
import { AuthProvider } from "./context/authContext";
import ErrorBoundary from "./ErrorBoundary"; // Import the ErrorBoundary component

// Initialize root
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <RecoilRoot>
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </HashRouter>
  </RecoilRoot>
);
