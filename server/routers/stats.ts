import { createRouter, publicQuery } from "../middleware.js";
export const statsRouter = createRouter({
  get: publicQuery.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const [{ count: p }, { count: b }, { count: c }, { count: d }, { data: f }] = await Promise.all([
      supabase.from("listed_properties").select("*", { count: "exact", head: true }),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      supabase.from("communities").select("*", { count: "exact", head: true }),
      supabase.from("download_requests").select("*", { count: "exact", head: true }),
      supabase.from("listed_properties").select("*").eq("featured", true).eq("status", "published"),
    ]);
    return { totalProperties: p ?? 0, totalBlogPosts: b ?? 0, totalCommunities: c ?? 0, totalDownloads: d ?? 0, featuredCount: f?.length ?? 0 };
  }),
});
