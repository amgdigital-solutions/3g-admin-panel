import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "../middleware.js";
export const blogPostsRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }),
  getById: publicQuery.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("blog_posts").select("*").eq("id", input.id).single();
    if (error) throw new Error(error.message);
    return data;
  }),
  create: adminQuery.input(z.object({
    title: z.string().min(1), slug: z.string().min(1), excerpt: z.string().default(""), content: z.string().default(""),
    category: z.string().default("Investment Guide"), author_name: z.string().default("3G Real Estate"),
    status: z.enum(["draft","published"]).default("draft"), featured_image: z.string().default(""),
    meta_title: z.string().default(""), meta_description: z.string().default(""), focus_keyword: z.string().default(""),
    tags: z.array(z.string()).default([]), faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  })).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("blog_posts").insert({ ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).select().single();
    if (error) throw new Error(error.message);
    return data;
  }),
  update: adminQuery.input(z.object({
    id: z.string().uuid(), title: z.string().min(1).optional(), slug: z.string().min(1).optional(),
    excerpt: z.string().optional(), content: z.string().optional(), category: z.string().optional(),
    author_name: z.string().optional(), status: z.enum(["draft","published"]).optional(),
    featured_image: z.string().optional(), meta_title: z.string().optional(),
    meta_description: z.string().optional(), focus_keyword: z.string().optional(),
    tags: z.array(z.string()).optional(), faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) if (val !== undefined) updates[key] = val;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await ctx.supabase.from("blog_posts").update(updates as any).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }),
  delete: adminQuery.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase.from("blog_posts").delete().eq("id", input.id);
    if (error) throw new Error(error.message);
    return { success: true };
  }),
});
