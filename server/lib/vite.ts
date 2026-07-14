import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";
type App = Hono<{ Bindings: HttpBindings }>;
export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  app.use("*", serveStatic({ root: "./dist/public" }));
  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) return c.json({ error: "Not Found" }, 404);
    return c.html(fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8"));
  });
}
