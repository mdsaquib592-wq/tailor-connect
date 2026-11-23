import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import TailorDashboard from "./pages/TailorDashboard";

function AppContent() {
  const { user, userData } = useAuth();

  if (!user || !userData) return <AuthPage />;
  if (userData.role === "tailor") return <TailorDashboard />;
  return <CustomerDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
