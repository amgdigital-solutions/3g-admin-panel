import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Check, Globe, Newspaper, Building2, MapPin, Home } from "lucide-react";

const REVALIDATE_URL = "https://3g-nextjs-site.vercel.app/api/revalidate";
const SECRET = "3g-revalidate-2026-secret";

interface CacheButtonProps {
  label: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

const cacheButtons: CacheButtonProps[] = [
  { label: "Homepage", path: "/", icon: <Home className="w-5 h-5" />, color: "bg-[#C9A84C]" },
  { label: "All Properties", path: "/properties", icon: <Building2 className="w-5 h-5" />, color: "bg-[#1E3A5F]" },
  { label: "Communities", path: "/communities", icon: <MapPin className="w-5 h-5" />, color: "bg-emerald-600" },
  { label: "Blog Articles", path: "/blog", icon: <Newspaper className="w-5 h-5" />, color: "bg-violet-600" },
  { label: "Full Site", path: "/", icon: <Globe className="w-5 h-5" />, color: "bg-red-600" },
];

function ClearCacheBtn({ label, path, icon, color }: CacheButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch(REVALIDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SECRET, path }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success(`${label} cache cleared!`);
      } else {
        toast.error(data.message || `Failed to clear ${label} cache`);
      }
    } catch {
      toast.error(`Network error clearing ${label} cache`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className={`flex items-center gap-3 p-3 rounded-lg text-white transition-all disabled:opacity-50 hover:brightness-110 text-left w-full ${color}`}
    >
      <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : done ? <Check className="w-5 h-5" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-white/60">{done ? "Cache cleared" : loading ? "Clearing..." : "Click to clear cache"}</p>
      </div>
    </button>
  );
}

export default function ClearCachePanel() {
  const [clearingAll, setClearingAll] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const handleClearAll = async () => {
    setClearingAll(true);
    setAllDone(false);
    const paths = ["/", "/properties", "/communities", "/blog"];
    let successCount = 0;

    for (const path of paths) {
      try {
        const res = await fetch(REVALIDATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: SECRET, path }),
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch { /* ignore individual failures */ }
    }

    setClearingAll(false);
    setAllDone(true);
    if (successCount > 0) {
      toast.success(`Cleared cache for ${successCount} pages`);
    } else {
      toast.error("Failed to clear cache. Check your Next.js revalidate API.");
    }

    setTimeout(() => setAllDone(false), 4000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Clear Website Cache</h2>
          <p className="text-sm text-gray-500">Force your Next.js site to show the latest content</p>
        </div>
        <Button
          onClick={handleClearAll}
          disabled={clearingAll}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {clearingAll ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : allDone ? <Check className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {clearingAll ? "Clearing All..." : allDone ? "All Cleared!" : "Clear All Caches"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cacheButtons.map((btn) => (
          <ClearCacheBtn key={btn.label} {...btn} />
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Tip: Use &quot;Clear All Caches&quot; after bulk uploading content. Individual buttons let you clear specific pages only.
      </p>
    </div>
  );
}
