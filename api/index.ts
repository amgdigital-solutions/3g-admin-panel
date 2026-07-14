import type { VercelRequest, VercelResponse } from "@vercel/node";
let app: any = null;
async function getApp() {
  if (!app) { const mod = await import("../dist/boot.js"); app = mod.default || mod; }
  return app;
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" });
    res.end(); return;
  }
  try {
    const honoApp = await getApp();
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const v of value) headers.append(key, v); else headers.set(key, value);
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
    const request = new Request(url, { method: req.method, headers, body });
    const response = await honoApp.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => res.setHeader(key, value));
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(await response.text());
  } catch (err: any) {
    console.error("[API Error]", err.message);
    res.statusCode = 500; res.setHeader("Content-Type", "application/json"); res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(JSON.stringify({ error: err.message }));
  }
}
