import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUpload from "@/components/ImageUpload";
import { BLOG_CATEGORIES, BLOG_STATUS } from "@/types";
import { ArrowLeft, Plus, X, Save } from "lucide-react";

interface FAQ { q: string; a: string; }

const emptyForm = {
  title: "", slug: "", excerpt: "", content: "", category: "Investment Guide",
  author_name: "3G Real Estate", status: "draft" as const, featured_image: "",
  meta_title: "", meta_description: "", focus_keyword: "", tags: [] as string[], faqs: [] as FAQ[],
};

async function fetchItem(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[BlogForm] API error ${res.status}`); return null; }
    const json = await res.json();
    return json.data || null;
  } catch (err) { console.error(`[BlogForm] Fetch error:`, err); return null; }
}

export default function BlogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newFaq, setNewFaq] = useState<FAQ>({ q: "", a: "" });
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      fetchItem(`/api/cms/blogs/${id}`).then((data) => {
        if (data) {
          setForm({
            title: data.title || "", slug: data.slug || "", excerpt: data.excerpt || "",
            content: data.content || "", category: data.category || "Investment Guide",
            author_name: data.author_name || data.author || "3G Real Estate", status: (data.status as "draft" | "published") || "draft",
            featured_image: data.featured_image || data.coverImage || "", meta_title: data.meta_title || "",
            meta_description: data.meta_description || "", focus_keyword: data.focus_keyword || "",
            tags: data.tags || [], faqs: (data.faqs as FAQ[]) || [],
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
      const url = isEditing && id ? `/api/cms/blogs/${id}` : "/api/cms/blogs";
      const method = isEditing && id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        toast.error(json.error || `Failed to ${isEditing ? "update" : "create"} blog post`);
        setIsSubmitting(false);
        return;
      }

      toast.success(isEditing ? "Blog post updated successfully!" : "Blog post created successfully!");
      navigate("/blog-posts");
    } catch (err) {
      console.error("[BlogForm] Submit error:", err);
      toast.error("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const addTag = () => { if (newTag.trim() && !form.tags.includes(newTag.trim())) { setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] })); setNewTag(""); } };
  const removeTag = (idx: number) => setForm(f => ({ ...f, tags: f.tags.filter((_, i) => i !== idx) }));
  const addFaq = () => { if (newFaq.q.trim() && newFaq.a.trim()) { setForm(f => ({ ...f, faqs: [...f.faqs, { ...newFaq }] })); setNewFaq({ q: "", a: "" }); } };
  const removeFaq = (idx: number) => setForm(f => ({ ...f, faqs: f.faqs.filter((_, i) => i !== idx) }));
  const updateField = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));
  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 60);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/blog-posts")}><ArrowLeft className="h-5 w-5" /></Button>
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/blog-posts")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">{isEditing ? "Edit Blog Post" : "Add Blog Post"}</h1>
          <p className="text-gray-500 text-sm">{isEditing ? "Update blog post" : "Create a new blog post"}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="faqs">FAQs {form.faqs.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{form.faqs.length}</Badge>}</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Post Title *</Label>
                  <Input value={form.title} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, title: val, slug: f.slug || generateSlug(val) })); }} placeholder="e.g. Top 10 Areas to Invest in Dubai 2024" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Slug (URL) *</Label>
                  <div className="flex items-center gap-2"><span className="text-sm text-gray-400 whitespace-nowrap">/blog/</span><Input value={form.slug} onChange={e => updateField("slug", e.target.value)} placeholder="top-areas-invest-dubai-2024" required /></div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => updateField("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BLOG_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Author Name</Label>
                  <Input value={form.author_name} onChange={e => updateField("author_name", e.target.value)} placeholder="3G Real Estate" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => updateField("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BLOG_STATUS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Excerpt</Label>
                  <Textarea value={form.excerpt} onChange={e => updateField("excerpt", e.target.value)} placeholder="Short summary for blog cards" rows={2} />
                </div>
              </div>
              <ImageUpload
                value={form.featured_image}
                onChange={(url) => updateField("featured_image", url)}
                type="blogs"
                label="Featured Image"
              />
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add a tag..." className="max-w-xs" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <Button type="button" onClick={addTag} variant="outline" size="sm"><Plus className="h-3.5 w-3.5" /></Button>
                </div>
                {form.tags.length > 0 && <div className="flex flex-wrap gap-1.5 pt-1">{form.tags.map((tag, idx) => <Badge key={idx} variant="secondary" className="gap-1">{tag}<button type="button" onClick={() => removeTag(idx)}><X className="h-3 w-3" /></button></Badge>)}</div>}
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <TiptapEditor content={form.content} onChange={html => updateField("content", html)} placeholder="Write your blog post content..." />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="seo" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="space-y-2"><Label>Focus Keyword</Label><Input value={form.focus_keyword} onChange={e => updateField("focus_keyword", e.target.value)} placeholder="Primary keyword" /></div>
              <div className="space-y-2"><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => updateField("meta_title", e.target.value)} placeholder="SEO title" maxLength={60} /><p className="text-xs text-gray-400">{form.meta_title.length}/60</p></div>
              <div className="space-y-2"><Label>Meta Description</Label><Textarea value={form.meta_description} onChange={e => updateField("meta_description", e.target.value)} placeholder="SEO description" rows={3} maxLength={160} /><p className="text-xs text-gray-400">{form.meta_description.length}/160</p></div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Google Search Preview</p>
                <p className="text-[#1a0dab] text-lg font-medium truncate">{form.meta_title || form.title || "Page Title"}</p>
                <p className="text-[#006621] text-sm">3guae.com &gt; blog &gt; {form.slug || "slug"}</p>
                <p className="text-[#545454] text-sm line-clamp-2 mt-0.5">{form.meta_description || form.excerpt || "No description."}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="faqs" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="space-y-3">
                <Label>Add FAQ</Label>
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
                        <div className="flex-1"><p className="font-medium text-sm text-[#1E3A5F]">{faq.q}</p><p className="text-sm text-gray-600 mt-1">{faq.a}</p></div>
                        <button type="button" onClick={() => removeFaq(idx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/blog-posts")}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#C9A84C] hover:bg-[#b89843] text-[#1E3A5F] font-semibold"><Save className="h-4 w-4 mr-2" />{isSubmitting ? "Saving..." : isEditing ? "Update Post" : "Create Post"}</Button>
        </div>
      </form>
    </div>
  );
}
