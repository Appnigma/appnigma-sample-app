import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";
import { AppProvider, useApp } from "./hooks/app-context";
import { CallsPage } from "./pages/CallsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { HomePage } from "./pages/HomePage";
import { IntegrationPage } from "./pages/IntegrationPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { SignInPage } from "./pages/SignInPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "integrations", element: <IntegrationsPage /> },
      { path: "integrations/:platform", element: <IntegrationPage /> },
      { path: "calls", element: <CallsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

const SignedInApp = () => {
  const { app } = useApp();
  return app.signedInAs ? <RouterProvider router={router} /> : <SignInPage />;
};

const App = () => (
  <AppProvider>
    <SignedInApp />
  </AppProvider>
);

export { App };
