import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ClearCachePanel from "@/components/ClearCachePanel";
import {
  Building2,
  FileText,
  MapPin,
  Download,
  Star,
  ArrowRight,
  Plus,
  TrendingUp,
  Users,
  Rocket,
  Globe,
  Newspaper,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";

const quickActions = [
  { label: "Add Property", path: "/properties/new", icon: Plus, color: "bg-[#1E3A5F]" },
  { label: "Add Blog Post", path: "/blog-posts/new", icon: Plus, color: "bg-[#C9A84C]" },
  { label: "Add Community", path: "/communities/new", icon: Plus, color: "bg-emerald-600" },
  { label: "View Downloads", path: "/download-requests", icon: Download, color: "bg-violet-600" },
];

interface Stats {
  totalProperties: number;
  totalBlogPosts: number;
  totalCommunities: number;
  totalDownloads: number;
  featuredCount: number;
}

async function fetchApi(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[Dashboard] API error ${res.status} for ${url}`); return []; }
    const json = await res.json();
    const data = json.data || json.result?.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) { console.error(`[Dashboard] Fetch error for ${url}:`, err); return []; }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [properties, blogs, communities, downloads] = await Promise.all([
        fetchApi("/api/cms/properties"),
        fetchApi("/api/cms/blogs"),
        fetchApi("/api/cms/communities"),
        fetchApi("/api/download-requests?action=list"),
      ]);
      if (cancelled) return;
      const featured = properties.filter((p: any) => p.showInHero || p.show_in_hero || p.featured).length;
      setStats({
        totalProperties: properties.length,
        totalBlogPosts: blogs.length,
        totalCommunities: communities.length,
        totalDownloads: downloads.length,
        featuredCount: featured,
      });
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
      const secret = "3g-revalidate-2026-secret";
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
        setPublishStatus({ message: data.message || `${type} published successfully!`, success: true });
      } else {
        setPublishStatus({ message: data.message || "Failed to publish.", success: false });
      }
    } catch (err: any) {
      setPublishStatus({ message: "Network error: " + err.message, success: false });
    } finally {
      setPublishing(null);
    }
  };

  const statCards = [
    { title: "Total Properties", value: stats?.totalProperties ?? 0, icon: Building2, color: "text-[#1E3A5F]", bg: "bg-[#1E3A5F]/10", path: "/properties" },
    { title: "Blog Posts", value: stats?.totalBlogPosts ?? 0, icon: FileText, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10", path: "/blog-posts" },
    { title: "Communities", value: stats?.totalCommunities ?? 0, icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-100", path: "/communities" },
    { title: "Download Requests", value: stats?.totalDownloads ?? 0, icon: Download, color: "text-violet-600", bg: "bg-violet-100", path: "/download-requests" },
    { title: "Featured Properties", value: stats?.featuredCount ?? 0, icon: Star, color: "text-amber-600", bg: "bg-amber-100", path: "/properties" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1E3A5F]">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your real estate portal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.path} className="group">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                  </div>
                  <div className="mt-3">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stat.value}</p>}
                    <p className="text-sm text-gray-500 mt-0.5">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.path}>
                <Button variant="outline" className="w-full h-16 justify-start gap-3 border-2 border-dashed hover:border-solid">
                  <div className={`${action.color} text-white p-1.5 rounded-md`}><Icon className="h-4 w-4" /></div>
                  <span className="font-medium">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <ClearCachePanel />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-[#1E3A5F]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
            <Rocket className="h-5 w-5 text-[#C9A84C]" />
            Publish to Live Site
          </CardTitle>
          <p className="text-white/60 text-sm">Push content changes to the public website immediately</p>
        </CardHeader>
        <CardContent>
          {publishStatus && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${publishStatus.success ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
              <div className="flex items-center gap-2">
                {publishStatus.success ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {publishStatus.message}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "All Properties", desc: "Update property listings", icon: Building2, type: "properties", path: "/properties" },
              { label: "Communities", desc: "Update communities", icon: MapPin, type: "communities", path: "/communities" },
              { label: "Blog Articles", desc: "Update blog listing", icon: Newspaper, type: "blog", path: "/blog" },
              { label: "Homepage", desc: "Update homepage", icon: Globe, type: "home", path: "/" },
            ].map((btn) => (
              <button key={btn.type} onClick={() => handlePublish(btn.type, btn.path)} disabled={publishing === btn.type}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50 text-left w-full">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {publishing === btn.type ? <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" /> : <btn.icon className="w-5 h-5 text-[#C9A84C]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{btn.label}</p>
                  <p className="text-xs text-white/50">{btn.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#C9A84C]" />At a Glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Building2, color: "text-[#1E3A5F]", label: "Properties Management", desc: `${stats?.totalProperties ?? 0} properties${stats?.featuredCount ? `, ${stats.featuredCount} featured` : ""}`, link: "/properties" },
              { icon: FileText, color: "text-[#C9A84C]", label: "Blog & Content", desc: `${stats?.totalBlogPosts ?? 0} posts, ${stats?.totalCommunities ?? 0} communities`, link: "/blog-posts" },
              { icon: Users, color: "text-emerald-600", label: "Lead Generation", desc: `${stats?.totalDownloads ?? 0} download requests`, link: "/download-requests" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <div className="flex-1"><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                <Link to={item.link}><Button size="sm" variant="ghost" className={item.color}>Manage</Button></Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-[#C9A84C]" />SEO / AEO Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Add FAQ sections to property pages for Google 'People Also Ask' visibility",
              "Use focus keywords in meta titles (50-60 characters optimal)",
              "Write unique meta descriptions for each property (150-160 characters)",
              "Include structured data (JSON-LD) for rich snippets in search results",
              "Keep blog content fresh - publish market updates regularly",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-[#C9A84C]">{i + 1}</span></div>
                <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
