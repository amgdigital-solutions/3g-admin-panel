import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router'
import {
  LogOut, Menu, X, Sun, Moon, Monitor, ChevronLeft, ChevronRight,
  LayoutDashboard, ArrowLeft, Bell,
} from 'lucide-react'
import { getCurrentUser, clearSession } from '@/lib/auth'
import { useTheme } from '@/context/ThemeContext'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
}

interface AdminLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  navItems: NavItem[]
  activeTab: string
  onTabChange: (id: string) => void
  accentColor?: string
  logoColor?: string
  showBack?: boolean
  backTo?: string
  extraActions?: ReactNode
}

export default function AdminLayout({
  children, title, subtitle, navItems, activeTab, onTabChange,
  accentColor = 'bg-gold', logoColor = 'bg-gold', showBack, backTo, extraActions,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const user = getCurrentUser()
  const { theme, setTheme, resolved, isDark } = useTheme()

  const handleLogout = () => { clearSession(); window.location.href = '/' }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B1120]' : 'bg-[#F1F5F9]'}`}>
      {/* ═════ MOBILE OVERLAY ═════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═════ SIDEBAR ═════ */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-out
          ${isDark ? 'bg-[#111827] border-r border-[#1E293B]' : 'bg-white border-r border-[#E2E8F0]'}
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between h-16 px-4 ${isDark ? 'border-b border-[#1E293B]' : 'border-b border-[#E2E8F0]'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-9 h-9 ${logoColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className="text-[#0B1120] font-serif text-sm font-bold">3G</span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              <div className={`text-sm font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{title}</div>
              {subtitle && <div className="text-[10px] whitespace-nowrap text-[#94A3B8]">{subtitle}</div>}
            </div>
          </div>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden lg:flex w-7 h-7 rounded-lg items-center justify-center transition-colors ${isDark ? 'hover:bg-[#1E293B] text-[#94A3B8]' : 'hover:bg-[#F1F5F9] text-[#64748B]'}`}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {/* Mobile close */}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-[#94A3B8]"><X className="w-5 h-5" /></button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setMobileOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group
                  ${isActive
                    ? `${accentColor} text-[#0B1120] font-semibold shadow-lg shadow-black/10`
                    : isDark
                      ? 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }
                `}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#0B1120]' : ''}`} />
                <span className={`whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                  {item.label}
                </span>
                {!sidebarOpen && isActive && (
                  <div className={`absolute left-0 w-1 h-6 ${accentColor} rounded-r-full`} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom: User + Theme */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 ${isDark ? 'border-t border-[#1E293B]' : 'border-t border-[#E2E8F0]'}`}>
          {/* Theme Toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-lg mb-2 ${isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]'}`}>
            {(['light', 'dark', 'system'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTheme(m)}
                className={`
                  flex-1 flex items-center justify-center py-1.5 rounded-md text-xs transition-all
                  ${theme === m
                    ? (isDark ? 'bg-[#374151] text-white shadow' : 'bg-white text-[#0F172A] shadow')
                    : 'text-[#94A3B8] hover:text-[#CBD5E1]'
                  }
                `}
                title={m.charAt(0).toUpperCase() + m.slice(1)}
              >
                {m === 'light' && <Sun className="w-3.5 h-3.5" />}
                {m === 'dark' && <Moon className="w-3.5 h-3.5" />}
                {m === 'system' && <Monitor className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDark ? 'bg-[#1E293B] text-[#CBD5E1]' : 'bg-[#E2E8F0] text-[#475569]'}`}>
              {user?.name?.[0] || 'U'}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              <div className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{user?.name || 'User'}</div>
              <div className="text-[10px] text-[#94A3B8] truncate">{user?.role === 'super_admin' ? 'Super Admin' : 'User'}</div>
            </div>
            <button
              onClick={handleLogout}
              className={`ml-auto p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1E293B] text-[#94A3B8]' : 'hover:bg-[#F1F5F9] text-[#64748B]'}`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═════ MAIN CONTENT ═════ */}
      <main className={`transition-all duration-300 min-h-screen ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 backdrop-blur-md ${isDark ? 'bg-[#0B1120]/80 border-b border-[#1E293B]' : 'bg-[#F1F5F9]/80 border-b border-[#E2E8F0]'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className={`lg:hidden p-2 rounded-lg ${isDark ? 'hover:bg-[#1E293B] text-[#94A3B8]' : 'hover:bg-white text-[#64748B]'}`}>
              <Menu className="w-5 h-5" />
            </button>
            {showBack && (
              <button onClick={() => navigate(backTo || '/select-dashboard')} className={`flex items-center gap-1 text-xs transition-colors ${isDark ? 'text-[#94A3B8] hover:text-white' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboards
              </button>
            )}
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              {navItems.find(n => n.id === activeTab)?.label || title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {extraActions}
            <div className={`relative p-2 rounded-lg ${isDark ? 'hover:bg-[#1E293B] text-[#94A3B8]' : 'hover:bg-white text-[#64748B]'}`}>
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
