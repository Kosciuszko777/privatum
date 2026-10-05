import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SecureUpload = lazy(() => import("./pages/SecureUpload"));
const SecurityCenter = lazy(() => import("./pages/SecurityCenter"));
const CreateSecureLink = lazy(() => import("./pages/CreateSecureLink"));
const PrivacyDashboard = lazy(() => import("./pages/PrivacyDashboard"));
const Login = lazy(() => import("./pages/Login"));
const Vault = lazy(() => import("./pages/Vault"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Messages = lazy(() => import("./pages/Messages"));
const Directory = lazy(() => import("./pages/Directory"));

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/create-link" element={<CreateSecureLink />} />
        <Route path="/security" element={<SecurityCenter />} />
        <Route path="/privacy-dashboard" element={<PrivacyDashboard />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/directory" element={<Directory />} />
        {/* Secure upload — permanent inbox */}
        <Route path="/inbox/:handle" element={<SecureUpload />} />
        {/* Secure upload — per-link */}
        <Route path="/drop/:token" element={<SecureUpload />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
