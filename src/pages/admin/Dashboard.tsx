import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  PhoneCall,
  TrendingUp,
  Eye,
  Star,
  Crown,
  ArrowUpRight,
  Rocket,
  Globe,
  Newspaper,
  MapPin,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { mockProperties } from "../../data/mockProperties";
import AdminLayout from "./AdminLayout";

function getUser() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("admin_user");
  return stored ? JSON.parse(stored) : null;
}

function formatPrice(price: number) {
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
  return `AED ${(price / 1000).toFixed(0)}K`;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{
    type: string;
    message: string;
    success: boolean;
  } | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  // Auto-clear publish status after 5 seconds
  useEffect(() => {
    if (publishStatus) {
      const timer = setTimeout(() => setPublishStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [publishStatus]);

  const handlePublish = async (type: string, path: string) => {
    setPublishing(type);
    setPublishStatus(null);

    try {
      const secret = "3g-revalidate-2026-secret"; // Match the secret in site-config.ts
      const res = await fetch(
        "https://3g-nextjs-site.vercel.app/api/revalidate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret, path }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setPublishStatus({
          type,
          message: data.message || `${type} published successfully!`,
          success: true,
        });
      } else {
        setPublishStatus({
          type,
          message: data.message || "Failed to publish. Check secret.",
          success: false,
        });
      }
    } catch (err: any) {
      setPublishStatus({
        type,
        message: "Network error: " + err.message,
        success: false,
      });
    } finally {
      setPublishing(null);
    }
  };

  const totalProperties = mockProperties.length;
  const featuredCount = mockProperties.filter(
    (p) => p.property_category === "off_plan" && p.listing_type === "featured"
  ).length;
  const exclusiveCount = mockProperties.filter(
    (p) => p.property_category === "exclusive"
  ).length;
  const normalCount = mockProperties.filter(
    (p) =>
      p.property_category === "off_plan" && p.listing_type !== "featured"
  ).length;
  const totalValue = mockProperties.reduce((sum, p) => sum + p.price, 0);
  const goldenVisaCount = mockProperties.filter(
    (p) => p.golden_visa_eligible
  ).length;

  const statCards = [
    {
      label: "Total Properties",
      value: totalProperties,
      icon: Building2,
      color: "bg-blue-500/10 text-blue-400",
    },
    {
      label: "Featured (Off-Plan)",
      value: featuredCount,
      icon: Star,
      color: "bg-[#c9a84c]/10 text-[#c9a84c]",
    },
    {
      label: "Exclusive (Ready)",
      value: exclusiveCount,
      icon: Crown,
      color: "bg-purple-500/10 text-purple-400",
    },
    {
      label: "Normal Listings",
      value: normalCount,
      icon: Eye,
      color: "bg-green-500/10 text-green-400",
    },
    {
      label: "Total Portfolio Value",
      value: formatPrice(totalValue),
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-400",
    },
    {
      label: "Golden Visa Eligible",
      value: goldenVisaCount,
      icon: Users,
      color: "bg-orange-500/10 text-orange-400",
    },
  ];

  const recentProperties = [...mockProperties]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back, {user?.name || "Admin"}
          </h1>
          <p className="text-gray-400 text-sm">
            Here&apos;s what&apos;s happening with your properties today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0a192f] border border-white/5 rounded-xl p-5"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Properties */}
          <div className="lg:col-span-2 bg-[#0a192f] border border-white/5 rounded-xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recent Properties
              </h2>
              <a
                href="/admin/properties"
                className="text-sm text-[#c9a84c] hover:text-[#dbc070] flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
            <div className="divide-y divide-white/5">
              {recentProperties.map((property) => (
                <div
                  key={property.id}
                  className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                    <img
                      src={property.featured_image}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {property.location}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          property.property_category === "exclusive"
                            ? "bg-purple-500/20 text-purple-400"
                            : property.listing_type === "featured"
                            ? "bg-[#c9a84c]/20 text-[#c9a84c]"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {property.property_category === "exclusive"
                          ? "Exclusive"
                          : property.listing_type === "featured"
                          ? "Featured"
                          : "Normal"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-white">
                      {formatPrice(property.price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.expected_roi} ROI
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#0a192f] border border-white/5 rounded-xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {user?.role !== "accountant" && user?.role !== "calling_agent" && (
                <a
                  href="/admin/properties"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#c9a84c] transition-colors">
                      Manage Properties
                    </p>
                    <p className="text-xs text-gray-500">
                      Add, edit, or remove listings
                    </p>
                  </div>
                </a>
              )}

              {(user?.role === "super_admin" || user?.role === "admin") && (
                <a
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#c9a84c] transition-colors">
                      Manage Users
                    </p>
                    <p className="text-xs text-gray-500">
                      Add team members and set roles
                    </p>
                  </div>
                </a>
              )}

              <a
                href="/admin/leads"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-[#c9a84c] transition-colors">
                    View Leads
                  </p>
                  <p className="text-xs text-gray-500">
                    Check new inquiries
                  </p>
                </div>
              </a>

              <a
                href="/admin/analytics"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-[#c9a84c] transition-colors">
                    Analytics
                  </p>
                  <p className="text-xs text-gray-500">
                    View performance metrics
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Publish to Live Site */}
          <div className="bg-[#0a192f] border border-white/5 rounded-xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#c9a84c]" />
                Publish to Live Site
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Push content changes to the public website immediately
              </p>
            </div>
            <div className="p-4 space-y-2">
              {/* Status message */}
              {publishStatus && (
                <div
                  className={`p-3 rounded-lg text-sm mb-3 ${
                    publishStatus.success
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {publishStatus.success ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 flex-shrink-0" />
                    )}
                    {publishStatus.message}
                  </div>
                </div>
              )}

              <PublishButton
                label="All Properties"
                description="Update property listings page"
                icon={Building2}
                color="text-blue-400"
                bgColor="bg-blue-500/10"
                loading={publishing === "properties"}
                onClick={() => handlePublish("properties", "/properties")}
              />
              <PublishButton
                label="Communities"
                description="Update communities page"
                icon={MapPin}
                color="text-purple-400"
                bgColor="bg-purple-500/10"
                loading={publishing === "communities"}
                onClick={() => handlePublish("communities", "/communities")}
              />
              <PublishButton
                label="Blog Articles"
                description="Update blog listing page"
                icon={Newspaper}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
                loading={publishing === "blog"}
                onClick={() => handlePublish("blog", "/blog")}
              />
              <PublishButton
                label="Homepage"
                description="Update homepage with latest content"
                icon={Globe}
                color="text-orange-400"
                bgColor="bg-orange-500/10"
                loading={publishing === "home"}
                onClick={() => handlePublish("home", "/")}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* Publish Button Component */
function PublishButton({
  label,
  description,
  icon: Icon,
  color,
  bgColor,
  loading,
  onClick,
}: {
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group disabled:opacity-60 text-left"
    >
      <div
        className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        {loading ? (
          <Loader2 className={`w-5 h-5 ${color} animate-spin`} />
        ) : (
          <Icon className={`w-5 h-5 ${color}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white group-hover:text-[#c9a84c] transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Rocket
        className={`w-4 h-4 text-gray-600 group-hover:text-[#c9a84c] transition-colors ${
          loading ? "opacity-0" : ""
        }`}
      />
    </button>
  );
}
