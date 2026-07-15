import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/layout/AdminLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PropertyList from "@/pages/properties/PropertyList";
import PropertyForm from "@/pages/properties/PropertyForm";
import BlogList from "@/pages/blog/BlogList";
import BlogForm from "@/pages/blog/BlogForm";
import CommunityList from "@/pages/communities/CommunityList";
import CommunityForm from "@/pages/communities/CommunityForm";
import DownloadRequestList from "@/pages/downloads/DownloadRequestList";
import SiteSettings from "@/pages/SiteSettings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E3A5F]">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/properties" element={<ProtectedRoute><PropertyList /></ProtectedRoute>} />
      <Route path="/properties/new" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
      <Route path="/properties/:id" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
      <Route path="/blog-posts" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
      <Route path="/blog-posts/new" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
      <Route path="/blog-posts/:id" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
      <Route path="/communities" element={<ProtectedRoute><CommunityList /></ProtectedRoute>} />
      <Route path="/communities/new" element={<ProtectedRoute><CommunityForm /></ProtectedRoute>} />
      <Route path="/communities/:id" element={<ProtectedRoute><CommunityForm /></ProtectedRoute>} />
      <Route path="/download-requests" element={<ProtectedRoute><DownloadRequestList /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SiteSettings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
