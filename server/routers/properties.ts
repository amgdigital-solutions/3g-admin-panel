import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "../middleware.js";
export const propertiesRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("listed_properties").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }),
  getById: publicQuery.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("listed_properties").select("*").eq("id", input.id).single();
    if (error) throw new Error(error.message);
    return data;
  }),
  create: adminQuery.input(z.object({
    title: z.string().min(1), slug: z.string().min(1), description: z.string().default(""), barcode: z.string().default(""),
    price: z.number().default(0), price_display: z.string().default(""), location: z.string().default(""),
    property_type: z.string().default("Apartment"), status: z.enum(["draft","published","sold_out"]).default("draft"),
    bedrooms: z.number().default(0), bathrooms: z.number().default(0), area_sqft: z.number().default(0), parking: z.number().default(0),
    featured: z.boolean().default(false), images: z.array(z.string()).default([]), amenities: z.array(z.string()).default([]),
    meta_title: z.string().default(""), meta_description: z.string().default(""), focus_keywords: z.string().default(""),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  })).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("listed_properties").insert({ ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).select().single();
    if (error) throw new Error(error.message);
    return data;
  }),
  update: adminQuery.input(z.object({
    id: z.string().uuid(), title: z.string().min(1).optional(), slug: z.string().min(1).optional(),
    description: z.string().optional(), barcode: z.string().optional(), price: z.number().optional(),
    price_display: z.string().optional(), location: z.string().optional(), property_type: z.string().optional(),
    status: z.enum(["draft","published","sold_out"]).optional(), bedrooms: z.number().optional(),
    bathrooms: z.number().optional(), area_sqft: z.number().optional(), parking: z.number().optional(),
    featured: z.boolean().optional(), images: z.array(z.string()).optional(), amenities: z.array(z.string()).optional(),
    meta_title: z.string().optional(), meta_description: z.string().optional(), focus_keywords: z.string().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) if (val !== undefined) updates[key] = val;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await ctx.supabase.from("listed_properties").update(updates as any).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }),
  delete: adminQuery.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase.from("listed_properties").delete().eq("id", input.id);
    if (error) throw new Error(error.message);
    return { success: true };
  }),
});
