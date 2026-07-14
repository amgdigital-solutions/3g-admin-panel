import { z } from "zod";
import { createRouter, adminQuery } from "../middleware.js";
export const downloadRequestsRouter = createRouter({
  list: adminQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("download_requests").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }),
  getById: adminQuery.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.from("download_requests").select("*").eq("id", input.id).single();
    if (error) throw new Error(error.message);
    return data;
  }),
});
