import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });
export const createRouter = t.router;
export const publicQuery = t.procedure;
export const adminQuery = t.procedure.use(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.get("x-admin-auth");
  if (!authHeader) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin auth required" });
  try {
    const auth = JSON.parse(authHeader);
    if (auth.email !== "admin@3guae.com" && auth.email !== "super@3guae.com") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    }
  } catch { throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid auth" }); }
  return next({ ctx });
});
