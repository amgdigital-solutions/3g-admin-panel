import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_TYPES, COMMUNITY_STATUS, COMMON_AMENITIES } from "@/types";
import { ArrowLeft, Plus, X, Save } from "lucide-react";

const emptyForm = { name: "", slug: "", description: "", short_description: "", image: "", gallery: [] as string[], location: "", avg_price: "", property_types: [] as string[], amenities: [] as string[], meta_title: "", meta_description: "", status: "draft" as const };

async function fetchItem(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[CommunityForm] API error ${res.status}`); return null; }
    const json = await res.json();
    return json.data || null;
  } catch (err) { console.error(`[CommunityForm] Fetch error:`, err); return null; }
}

export default function CommunityForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      fetchItem(`/api/cms/communities/${id}`).then((data) => {
        if (data) {
          setForm({
            name: data.name || "", slug: data.slug || "",
            description: data.description || data.longDescription || "",
            short_description: data.short_description || data.description || "",
            image: data.image || "", gallery: data.gallery || [],
            location: data.location || "", avg_price: data.avg_price || data.priceRange || "",
            property_types: data.property_types || data.propertyTypes || [],
            amenities: data.amenities || [],
            meta_title: data.meta_title || "", meta_description: data.meta_description || "",
            status: (data.status as "draft" | "published") || (data.isPublished ? "published" : "draft"),
          });
        }
        setIsLoading(false);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        await fetch(`/api/cms/communities/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/cms/communities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      navigate("/communities");
    } catch (err) {
      console.error("[CommunityForm] Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));
  const addGalleryImage = () => { if (newGalleryUrl.trim()) { setForm((f) => ({ ...f, gallery: [...f.gallery, newGalleryUrl.trim()] })); setNewGalleryUrl(""); } };
  const removeGalleryImage = (idx: number) => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }));
  const togglePropertyType = (type: string) => setForm((f) => ({ ...f, property_types: f.property_types.includes(type) ? f.property_types.filter((t) => t !== type) : [...f.property_types, type] }));
  const toggleAmenity = (amenity: string) => setForm((f) => ({ ...f, amenities: f.amenities.includes(amenity) ? f.amenities.filter((a) => a !== amenity) : [...f.amenities, amenity] }));
  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 60);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/communities")}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-2xl font-bold text-[#1E3A5F]">Loading...</h1></div>
        </div>
        <div className="bg-white rounded-lg border p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/communities")}><ArrowLeft className="h-5 w-5" /></Button>
        <div><h1 className="text-2xl font-bold text-[#1E3A5F]">{isEditing ? "Edit Community" : "Add Community"}</h1><p className="text-gray-500 text-sm">{isEditing ? "Update community details" : "Create a new community"}</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="bg-white border"><TabsTrigger value="basic">Basic Info</TabsTrigger><TabsTrigger value="media">Media & Details</TabsTrigger><TabsTrigger value="seo">SEO</TabsTrigger></TabsList>
          <TabsContent value="basic" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Community Name *</Label><Input value={form.name} onChange={(e) => { const val = e.target.value; setForm((f) => ({ ...f, name: val, slug: f.slug || generateSlug(val) })); }} placeholder="e.g. Dubai Marina" required /></div>
                <div className="space-y-2 md:col-span-2"><Label>Slug (URL) *</Label><div className="flex items-center gap-2"><span className="text-sm text-gray-400 whitespace-nowrap">/community/</span><Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="dubai-marina" required /></div></div>
                <div className="space-y-2 md:col-span-2"><Label>Short Description</Label><Textarea value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} placeholder="Brief summary for cards" rows={2} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Full Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Detailed community description..." rows={6} /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="e.g. Dubai Marina" /></div>
                <div className="space-y-2"><Label>Average Price Range</Label><Input value={form.avg_price} onChange={(e) => updateField("avg_price", e.target.value)} placeholder="e.g. AED 1.2M - 5M" /></div>
                <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => updateField("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMMUNITY_STATUS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Hero Image URL</Label><Input value={form.image} onChange={(e) => updateField("image", e.target.value)} placeholder="https://..." /></div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="media" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div className="space-y-3"><Label>Photo Gallery</Label><div className="flex gap-2"><Input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="Paste image URL..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())} /><Button type="button" onClick={addGalleryImage} variant="outline"><Plus className="h-4 w-4" /></Button></div>
                {form.gallery.length > 0 ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{form.gallery.map((url, idx) => (<div key={idx} className="relative group"><img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80'%3E%3Crect fill='%23f3f4f6' width='100' height='80'/%3E%3Ctext fill='%239ca3af' x='50' y='40' text-anchor='middle' font-size='10'%3EInvalid URL%3C/text%3E%3C/svg%3E"; }} /><button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>))}</div> : <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed rounded-lg">No gallery images added yet</p>}
              </div>
              <div className="space-y-3"><Label>Property Types Available</Label><div className="flex flex-wrap gap-2">{PROPERTY_TYPES.map((type) => (<button key={type} type="button" onClick={() => togglePropertyType(type)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.property_types.includes(type) ? "bg-[#1E3A5F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{type}</button>))}</div></div>
              <div className="space-y-3"><Label>Community Amenities</Label><div className="flex flex-wrap gap-2">{COMMON_AMENITIES.map((amenity) => (<button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.amenities.includes(amenity) ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{amenity}</button>))}</div></div>
            </div>
          </TabsContent>
          <TabsContent value="seo" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="space-y-2"><Label>Meta Title</Label><Input value={form.meta_title} onChange={(e) => updateField("meta_title", e.target.value)} placeholder="SEO title" maxLength={60} /><p className="text-xs text-gray-400">{form.meta_title.length}/60</p></div>
              <div className="space-y-2"><Label>Meta Description</Label><Textarea value={form.meta_description} onChange={(e) => updateField("meta_description", e.target.value)} placeholder="SEO description" rows={3} maxLength={160} /><p className="text-xs text-gray-400">{form.meta_description.length}/160</p></div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Google Search Preview</p><p className="text-[#1a0dab] text-lg font-medium truncate">{form.meta_title || form.name || "Page Title"}</p><p className="text-[#006621] text-sm">3guae.com &gt; community &gt; {form.slug || "slug"}</p><p className="text-[#545454] text-sm line-clamp-2 mt-0.5">{form.meta_description || form.short_description || "No description provided."}</p></div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6"><Button type="button" variant="outline" onClick={() => navigate("/communities")}>Cancel</Button><Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" />{isSubmitting ? "Saving..." : isEditing ? "Update Community" : "Create Community"}</Button></div>
      </form>
    </div>
  );
}
