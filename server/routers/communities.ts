import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "../middleware.js";
export const communitiesRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("communities").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }),
  getById: publicQuery.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("communities").select("*").eq("id", input.id).single();
    if (error) throw new Error(error.message);
    return data;
  }),
  create: adminQuery.input(z.object({
    name: z.string().min(1), slug: z.string().min(1), description: z.string().default(""), short_description: z.string().default(""),
    image: z.string().default(""), gallery: z.array(z.string()).default([]), location: z.string().default(""),
    avg_price: z.string().default(""), property_types: z.array(z.string()).default([]), amenities: z.array(z.string()).default([]),
    meta_title: z.string().default(""), meta_description: z.string().default(""), status: z.enum(["draft","published"]).default("draft"),
  })).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("communities").insert({ ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).select().single();
    if (error) throw new Error(error.message);
    return data;
  }),
  update: adminQuery.input(z.object({
    id: z.string().uuid(), name: z.string().min(1).optional(), slug: z.string().min(1).optional(),
    description: z.string().optional(), short_description: z.string().optional(), image: z.string().optional(),
    gallery: z.array(z.string()).optional(), location: z.string().optional(), avg_price: z.string().optional(),
    property_types: z.array(z.string()).optional(), amenities: z.array(z.string()).optional(),
    meta_title: z.string().optional(), meta_description: z.string().optional(), status: z.enum(["draft","published"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) if (val !== undefined) updates[key] = val;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await ctx.supabase.from("communities").update(updates as any).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }),
  delete: adminQuery.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase.from("communities").delete().eq("id", input.id);
    if (error) throw new Error(error.message);
    return { success: true };
  }),
});
