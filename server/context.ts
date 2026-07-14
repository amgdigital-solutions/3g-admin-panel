import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getSupabaseAdmin } from "./queries/supabase.js";

export type TrpcContext = { req: Request; resHeaders: Headers; supabase: ReturnType<typeof getSupabaseAdmin> };

export async function createContext(opts: FetchCreateContextFnOptions): Promise<TrpcContext> {
  return { req: opts.req, resHeaders: opts.resHeaders, supabase: getSupabaseAdmin() };
}
