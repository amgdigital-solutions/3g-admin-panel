import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUpload, { GalleryUpload } from "@/components/ImageUpload";
import { PROPERTY_TYPES, PROPERTY_STATUS, COMMON_AMENITIES } from "@/types";
import { ArrowLeft, Plus, X, Save, Barcode } from "lucide-react";

interface FAQ { q: string; a: string; }

const emptyForm = {
  title: "", slug: "", description: "", barcode: "", price: 0, price_display: "", location: "",
  property_type: "Apartment", status: "draft" as const, bedrooms: 0, bathrooms: 0, area_sqft: 0,
  parking: 0, featured: false, images: [] as string[], amenities: [] as string[],
  meta_title: "", meta_description: "", focus_keywords: "", faqs: [] as FAQ[],
};

async function fetchItem(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[PropertyForm] API error ${res.status}`); return null; }
    const json = await res.json();
    return json.data || null;
  } catch (err) { console.error(`[PropertyForm] Fetch error:`, err); return null; }
}

export default function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const [newFaq, setNewFaq] = useState<FAQ>({ q: "", a: "" });
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      fetchItem(`/api/cms/properties/${id}`).then((data) => {
        if (data) {
          setForm({
            title: data.title || "", slug: data.slug || "", description: data.description || data.content || "",
            barcode: data.barcode || "", price: data.price || 0, price_display: data.price_display || "",
            location: data.location || "", property_type: data.property_type || data.category || "Apartment",
            status: (data.status as "draft" | "published" | "sold_out") || "draft", bedrooms: data.bedrooms || 0,
            bathrooms: data.bathrooms || 0, area_sqft: data.area_sqft || 0, parking: data.parking || 0,
            featured: data.showInHero || data.show_in_hero || false, images: data.images || [], amenities: data.amenities || [],
            meta_title: data.meta_title || "", meta_description: data.meta_description || "",
            focus_keywords: data.focus_keywords || "", faqs: (data.faqs as FAQ[]) || [],
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
      const payload = { ...form, show_in_hero: form.featured };
      const url = isEditing && id ? `/api/cms/properties/${id}` : "/api/cms/properties";
      const method = isEditing && id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        toast.error(json.error || `Failed to ${isEditing ? "update" : "create"} property`);
        setIsSubmitting(false);
        return;
      }

      toast.success(isEditing ? "Property updated successfully!" : "Property created successfully!");
      navigate("/properties");
    } catch (err) {
      console.error("[PropertyForm] Submit error:", err);
      toast.error("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => setForm(f => ({ ...f, amenities: f.amenities.includes(amenity) ? f.amenities.filter(a => a !== amenity) : [...f.amenities, amenity] }));
  const addCustomAmenity = () => { if (newAmenity.trim() && !form.amenities.includes(newAmenity.trim())) { setForm(f => ({ ...f, amenities: [...f.amenities, newAmenity.trim()] })); setNewAmenity(""); } };
  const addFaq = () => { if (newFaq.q.trim() && newFaq.a.trim()) { setForm(f => ({ ...f, faqs: [...f.faqs, { ...newFaq }] })); setNewFaq({ q: "", a: "" }); } };
  const removeFaq = (idx: number) => setForm(f => ({ ...f, faqs: f.faqs.filter((_, i) => i !== idx) }));
  const updateField = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));
  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 60);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/properties")}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-2xl font-bold text-[#1E3A5F]">Loading...</h1></div>
        </div>
        <div className="bg-white rounded-lg border p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/properties")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">{isEditing ? "Edit Property" : "Add Property"}</h1>
          <p className="text-gray-500 text-sm">{isEditing ? "Update property details" : "Create a new property listing"}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media & Amenities</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="faqs">FAQs {form.faqs.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{form.faqs.length}</Badge>}</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Property Title *</Label>
                  <Input value={form.title} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, title: val, slug: f.slug || generateSlug(val) })); }} placeholder="e.g. Luxury 2BR in Dubai Marina" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Slug (URL) *</Label>
                  <div className="flex items-center gap-2"><span className="text-sm text-gray-400 whitespace-nowrap">/property/</span><Input value={form.slug} onChange={e => updateField("slug", e.target.value)} placeholder="luxury-2br-dubai-marina" required /></div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label><Barcode className="h-4 w-4 inline mr-1.5 text-gray-400" />Barcode Image</Label>
                  <ImageUpload
                    value={form.barcode}
                    onChange={(url) => updateField("barcode", url)}
                    type="properties"
                    label="Barcode / QR Code"
                    folder="barcodes"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <TiptapEditor content={form.description} onChange={html => updateField("description", html)} placeholder="Write property description..." />
                </div>
                <div className="space-y-2"><Label>Price (AED)</Label><Input type="number" value={form.price || ""} onChange={e => updateField("price", Number(e.target.value))} placeholder="1200000" /></div>
                <div className="space-y-2"><Label>Price Display Text</Label><Input value={form.price_display} onChange={e => updateField("price_display", e.target.value)} placeholder="e.g. 1.2M AED" /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => updateField("location", e.target.value)} placeholder="e.g. Dubai Marina" /></div>
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={form.property_type} onValueChange={v => updateField("property_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => updateField("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_STATUS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Bedrooms</Label><Input type="number" value={form.bedrooms || ""} onChange={e => updateField("bedrooms", Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Bathrooms</Label><Input type="number" value={form.bathrooms || ""} onChange={e => updateField("bathrooms", Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Area (sqft)</Label><Input type="number" value={form.area_sqft || ""} onChange={e => updateField("area_sqft", Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Parking Spots</Label><Input type="number" value={form.parking || ""} onChange={e => updateField("parking", Number(e.target.value))} /></div>
                <div className="flex items-center gap-3 pt-4"><Switch id="featured" checked={form.featured} onCheckedChange={v => updateField("featured", v)} /><Label htmlFor="featured" className="cursor-pointer">Featured on Homepage</Label></div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="media" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <ImageUpload
                value={form.images[0] || ""}
                onChange={(url) => {
                  const imgs = [...form.images];
                  if (imgs.length === 0) imgs.push(url); else imgs[0] = url;
                  updateField("images", imgs);
                }}
                type="properties"
                label="Featured Image (Hero)"
              />
              <GalleryUpload
                images={form.images.filter((_, i) => i > 0)}
                onChange={(galleryUrls) => {
                  const hero = form.images[0] || "";
                  updateField("images", hero ? [hero, ...galleryUrls] : galleryUrls);
                }}
                type="properties"
                label="Photo Gallery"
              />
              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_AMENITIES.map(amenity => (
                    <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.amenities.includes(amenity) ? "bg-[#1E3A5F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{amenity}</button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)} placeholder="Add custom amenity..." className="max-w-xs" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())} />
                  <Button type="button" onClick={addCustomAmenity} variant="outline" size="sm"><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="seo" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={form.meta_title} onChange={e => updateField("meta_title", e.target.value)} placeholder="SEO title (50-60 chars)" maxLength={60} />
                <p className="text-xs text-gray-400">{form.meta_title.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={form.meta_description} onChange={e => updateField("meta_description", e.target.value)} placeholder="SEO description (150-160 chars)" rows={3} maxLength={160} />
                <p className="text-xs text-gray-400">{form.meta_description.length}/160 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Focus Keywords</Label>
                <Input value={form.focus_keywords} onChange={e => updateField("focus_keywords", e.target.value)} placeholder="e.g. Dubai Marina apartment, luxury property" />
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Google Search Preview</p>
                <p className="text-[#1a0dab] text-lg font-medium truncate">{form.meta_title || form.title || "Page Title"}</p>
                <p className="text-[#006621] text-sm">3guae.com &gt; property &gt; {form.slug || "slug"}</p>
                <p className="text-[#545454] text-sm line-clamp-2 mt-0.5">{form.meta_description || form.description?.substring(0, 160) || "No description provided."}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="faqs" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="space-y-3">
                <Label>Add FAQ (People Also Ask)</Label>
                <Input value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} placeholder="Question..." />
                <Textarea value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} placeholder="Answer..." rows={2} />
                <Button type="button" onClick={addFaq} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add FAQ</Button>
              </div>
              {form.faqs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <Label>Existing FAQs ({form.faqs.length})</Label>
                  {form.faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-gray-50 border group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#1E3A5F]">{faq.q}</p>
                          <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
                        </div>
                        <button type="button" onClick={() => removeFaq(idx)} className="text-red-400 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/properties")}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#1E3A5F] hover:bg-[#152d4a]"><Save className="h-4 w-4 mr-2" />{isSubmitting ? "Saving..." : isEditing ? "Update Property" : "Create Property"}</Button>
        </div>
      </form>
    </div>
  );
}
