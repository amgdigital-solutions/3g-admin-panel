import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Building2, FileText, MapPin, Download, Menu, LogOut, ChevronLeft, ChevronRight, Home } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/blog-posts", label: "Blog Posts", icon: FileText },
  { path: "/communities", label: "Communities", icon: MapPin },
  { path: "/download-requests", label: "Downloads", icon: Download },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      <aside className={`hidden md:flex flex-col bg-[#1E3A5F] text-white transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Home className="h-5 w-5 text-[#C9A84C]" />
              <span className="font-bold text-lg tracking-tight">3G Admin</span>
            </Link>
          )}
          {collapsed && <Home className="h-5 w-5 text-[#C9A84C] mx-auto" />}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/10 transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-[#C9A84C] text-[#1E3A5F] font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"} ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-2">
              <p className="text-xs text-white/50">Logged in as</p>
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          )}
          <button onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-red-600/20 hover:text-red-400 transition-all w-full ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Logout" : undefined}>
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1E3A5F] text-white h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-[#C9A84C]" />
          <span className="font-bold">3G Admin</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1E3A5F] text-white border-none w-64">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 py-4 border-b border-white/10">
                <Home className="h-5 w-5 text-[#C9A84C]" />
                <span className="font-bold text-lg">3G Admin</span>
              </div>
              <nav className="flex-1 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? "bg-[#C9A84C] text-[#1E3A5F] font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                      <Icon className="h-5 w-5" /><span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/10 pt-4">
                {user && (<div className="px-3 py-2 mb-2"><p className="text-xs text-white/50">Logged in as</p><p className="text-sm font-medium">{user.email}</p></div>)}
                <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-red-600/20 hover:text-red-400 transition-all w-full">
                  <LogOut className="h-5 w-5" /><span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
