import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DecideMeal from "./pages/DecideMeal";
import GroceryList from "./pages/GroceryList";
import MealHistory from "./pages/MealHistory";
import Pantry from "./pages/Pantry";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import UseSoon from "./pages/UseSoon";

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b07] px-4 text-[#fff8e8]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#d7f75b]/20 border-t-[#d7f75b]" />
        <p className="display-font text-2xl font-extrabold">Loading MealMind</p>
        <p className="mt-2 text-sm text-[#b7b89f]">
          Checking your kitchen session...
        </p>
      </div>
    </main>
  );
}

function ProtectedApp() {
  const { isLoggedIn, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/decide-meal" element={<DecideMeal />} />
        <Route path="/meal-history" element={<MealHistory />} />
        <Route path="/use-soon" element={<UseSoon />} />
        <Route path="/grocery-list" element={<GroceryList />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;