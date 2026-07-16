import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarChart3, Save, Check, Copy, AlertTriangle, Database } from "lucide-react";

const STORAGE_KEY = "3g_admin_settings";

interface SiteSettings {
  ga4Id: string;
  gtmId: string;
  fbPixelId: string;
  metaVerification: string;
  hotjarId: string;
  customHead: string;
  customBody: string;
}

const defaultSettings: SiteSettings = {
  ga4Id: "",
  gtmId: "",
  fbPixelId: "",
  metaVerification: "",
  hotjarId: "",
  customHead: "",
  customBody: "",
};

function loadLocalSettings(): SiteSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...defaultSettings };
}

function saveLocalSettings(settings: SiteSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function generateScriptTags(settings: SiteSettings): string {
  let code = `<!-- 3G Real Estate - Tracking & Analytics -->\n`;

  if (settings.gtmId) {
    code += `\n<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtmId}');</script>\n<!-- End Google Tag Manager -->\n`;
  }

  if (settings.ga4Id) {
    code += `\n<!-- GA4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${settings.ga4Id}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.ga4Id}');</script>\n`;
  }

  if (settings.fbPixelId) {
    code += `\n<!-- Facebook Pixel -->\n<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.fbPixelId}');fbq('track','PageView');</script>\n<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${settings.fbPixelId}&ev=PageView&noscript=1"/></noscript>\n`;
  }

  if (settings.metaVerification) {
    code += `\n<meta name="facebook-domain-verification" content="${settings.metaVerification}" />\n`;
  }

  if (settings.hotjarId) {
    code += `\n<!-- Hotjar -->\n<script>(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${settings.hotjarId},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');</script>\n`;
  }

  if (settings.customHead) {
    code += `\n<!-- Custom Head Code -->\n${settings.customHead}\n`;
  }

  if (settings.customBody) {
    code += `\n<!-- Custom Body Code (paste before </body>) -->\n${settings.customBody}\n`;
  }

  return code;
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(false);
  const [saveMode, setSaveMode] = useState<"api" | "local">("local");

  // Load settings from API on mount (with localStorage fallback)
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/site-settings");
      const json = await res.json();
      // FIX: Use dbAvailable flag instead of checking data object keys
      // An empty table returns data:{} with dbAvailable:true — that's valid
      if (json.success && json.dbAvailable === true) {
        setSettings({ ...defaultSettings, ...json.data });
        setDbAvailable(true);
        setSaveMode("api");
      } else {
        // API returned empty — fall back to localStorage
        setSettings(loadLocalSettings());
        setDbAvailable(false);
        setSaveMode("local");
      }
    } catch {
      // API failed entirely — fall back to localStorage
      setSettings(loadLocalSettings());
      setDbAvailable(false);
      setSaveMode("local");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const updateField = (field: keyof SiteSettings, value: string) => {
    setSettings((s) => ({ ...s, [field]: value }));
  };

  const handleSave = async () => {
    let savedToApi = false;

    // Try API first if DB is available
    if (saveMode === "api" || dbAvailable) {
      try {
        const res = await fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const json = await res.json();
        if (json.success) {
          savedToApi = true;
          setDbAvailable(true);
          setSaveMode("api");
          toast.success("Settings saved to Supabase");
        } else {
          // API save failed — fall back to localStorage
          setDbAvailable(false);
          setSaveMode("local");
        }
      } catch {
        setDbAvailable(false);
        setSaveMode("local");
      }
    }

    // Always save to localStorage as backup
    saveLocalSettings(settings);

    if (!savedToApi) {
      toast.success("Settings saved locally (Supabase table not ready)");
    }

    setSaved(true);
  };

  const scriptCode = generateScriptTags(settings);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    toast.success("Code copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Loading...</p>
        </div>
        <div className="bg-white rounded-lg border p-6 animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure tracking codes and third-party integrations</p>
        </div>
        <div className="flex items-center gap-2">
          {dbAvailable ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
              <Database className="h-3 w-3 mr-1" /> Supabase
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-3 w-3 mr-1" /> Local Only
            </Badge>
          )}
        </div>
      </div>

      {!dbAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Supabase table not found</p>
            <p className="text-sm text-amber-700 mt-1">
              Settings are being saved to your browser only. To enable cloud persistence, create the <code className="bg-amber-100 px-1 rounded">site_settings</code> table in Supabase (see SQL below).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#C9A84C]" />
              Analytics & Tracking
            </CardTitle>
            <p className="text-xs text-gray-500">Paste your tracking IDs here. The code will be generated for you to add to your Next.js site.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Google Analytics 4 ID</Label>
                {settings.ga4Id && <Badge variant="outline" className="text-xs text-emerald-600">Active</Badge>}
              </div>
              <Input value={settings.ga4Id} onChange={(e) => updateField("ga4Id", e.target.value)} placeholder="G-XXXXXXXXXX" />
              <p className="text-xs text-gray-400">Find in GA4: Admin &gt; Data Streams &gt; Web Stream</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Google Tag Manager ID</Label>
                {settings.gtmId && <Badge variant="outline" className="text-xs text-emerald-600">Active</Badge>}
              </div>
              <Input value={settings.gtmId} onChange={(e) => updateField("gtmId", e.target.value)} placeholder="GTM-XXXXXXX" />
              <p className="text-xs text-gray-400">Optional - use if you manage all tags through GTM</p>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Facebook Pixel ID</Label>
                {settings.fbPixelId && <Badge variant="outline" className="text-xs text-emerald-600">Active</Badge>}
              </div>
              <Input value={settings.fbPixelId} onChange={(e) => updateField("fbPixelId", e.target.value)} placeholder="XXXXXXXXXXXXXXXX" />
            </div>

            <div className="space-y-2">
              <Label>Meta Domain Verification</Label>
              <Input value={settings.metaVerification} onChange={(e) => updateField("metaVerification", e.target.value)} placeholder="verification code" />
              <p className="text-xs text-gray-400">For Meta Business domain verification</p>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hotjar Site ID</Label>
                {settings.hotjarId && <Badge variant="outline" className="text-xs text-emerald-600">Active</Badge>}
              </div>
              <Input value={settings.hotjarId} onChange={(e) => updateField("hotjarId", e.target.value)} placeholder="XXXXXXX" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#C9A84C]" />
              Custom Code
            </CardTitle>
            <p className="text-xs text-gray-500">Add any custom HTML/JS for other tools not listed above.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Custom &lt;head&gt; Code</Label>
              <textarea value={settings.customHead} onChange={(e) => updateField("customHead", e.target.value)} placeholder="<script>...</script>\n<meta ...>" rows={6} className="w-full px-3 py-2 border rounded-md text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent resize-y" />
              <p className="text-xs text-gray-400">This code will be placed inside the &lt;head&gt; tag</p>
            </div>

            <div className="space-y-2">
              <Label>Custom &lt;body&gt; Code</Label>
              <textarea value={settings.customBody} onChange={(e) => updateField("customBody", e.target.value)} placeholder="<script>...</script>" rows={6} className="w-full px-3 py-2 border rounded-md text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent resize-y" />
              <p className="text-xs text-gray-400">This code will be placed before the closing &lt;/body&gt; tag</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Generated Code</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy All Code
            </Button>
          </div>
          <p className="text-xs text-gray-500">Copy this code and paste it into your Next.js site&apos;s layout.tsx or _document.tsx file</p>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
            {scriptCode || "<!-- Add at least one tracking ID above to generate code -->"}
          </pre>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button onClick={handleSave} className="bg-[#1E3A5F] hover:bg-[#152d4a]">
          {saved ? <><Check className="h-4 w-4 mr-2" /> Saved</> : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}
        </Button>
      </div>

      {!dbAvailable && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Enable Cloud Persistence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-700">
              Run this SQL in your Supabase SQL Editor to create the <code className="bg-amber-100 px-1 rounded">site_settings</code> table:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
{`CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  ga4_id text,
  gtm_id text,
  fb_pixel_id text,
  meta_verification text,
  hotjar_id text,
  custom_head text,
  custom_body text,
  updated_at timestamptz DEFAULT now()
);`}
            </pre>
            <p className="text-xs text-amber-600">
              After creating the table, refresh this page and your settings will be saved to Supabase automatically.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">How to add to your Next.js site:</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Click &quot;Copy All Code&quot; above</li>
          <li>Open your Next.js site code (3g-nextjs-site)</li>
          <li>Find <code>app/layout.tsx</code> or <code>app/[locale]/layout.tsx</code></li>
          <li>Paste the code inside the <code>&lt;head&gt;</code> section</li>
          <li>Redeploy your Next.js site</li>
        </ol>
      </div>
    </div>
  );
}
