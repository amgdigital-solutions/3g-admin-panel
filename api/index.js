// ═══════════════════════════════════════════════════════════════════
//  3G Real Estate API — Zero dependencies, Node.js 20 native fetch
//  Connects to Supabase REST API directly
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";

// ── CORS Headers ──────────────────────────────────────────────────
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

// ── Helpers ───────────────────────────────────────────────────────
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function matchRoute(url, pattern) {
  const regex = new RegExp(`^${pattern.replace(/:id/, "([^/]+)").replace(/:slug/, "([^/]+)")}$`);
  const m = url.match(regex);
  return m ? m[1] : null;
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ── Supabase REST API helpers ─────────────────────────────────────
async function supabaseGet(table, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase GET error: ${res.status}`);
  return res.json();
}

async function supabasePost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase POST error: ${res.status}`);
  return res.json();
}

async function supabasePatch(table, query, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "PATCH",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH error: ${res.status}`);
  return res.json();
}

async function supabaseDelete(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase DELETE error: ${res.status}`);
  return true;
}

// ── Admin Auth (simple token-based) ──────────────────────────────
const ADMIN_USERS = [
  { id: "admin-1", username: "admin", name: "Admin", email: "admin@3guae.com", role: "super_admin", password: "admin123" },
  { id: "admin-2", username: "qasim", name: "Qasim", email: "qasim@3guae.com", role: "super_admin", password: "qasim@3g123" },
];

function generateToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role, exp: Date.now() + 86400000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// ── Request Handler ───────────────────────────────────────────────
module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors); res.end(); return;
  }

  const url = req.url || "";
  console.log(`[API] ${req.method} ${url}`);

  // Health check
  if (url === "/api/ping" || url === "/api/") {
    res.writeHead(200, cors);
    res.end(JSON.stringify({
      ok: true,
      dbConnected: !!SUPABASE_URL && !!SUPABASE_KEY,
      supabaseUrl: SUPABASE_URL ? "configured" : "missing",
      supabaseKey: SUPABASE_KEY ? "configured" : "missing",
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.writeHead(500, cors);
    res.end(JSON.stringify({ error: "Supabase not configured", url: SUPABASE_URL ? "set" : "missing", key: SUPABASE_KEY ? "set" : "missing" }));
    return;
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    //  PROPERTIES
    // ═══════════════════════════════════════════════════════════════

    if (url === "/api/properties" && req.method === "GET") {
      const data = await supabaseGet("listed_properties", "?is_published=eq.true&hidden=eq.false&order=id.asc");
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: data || [] } })); return;
    }

    const propertyId = matchRoute(url, "/api/properties/:id");
    if (propertyId && req.method === "GET") {
      const data = await supabaseGet("listed_properties", `?id=eq.${propertyId}&limit=1`);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: data?.[0] || null } })); return;
    }

    if (url === "/api/properties" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.slug && body.title) body.slug = generateSlug(body.title);
      const data = await supabasePost("listed_properties", body);
      res.writeHead(201, cors); res.end(JSON.stringify({ result: { data: data?.[0], success: true } })); return;
    }

    if (propertyId && req.method === "PUT") {
      const body = await parseBody(req);
      const data = await supabasePatch("listed_properties", `?id=eq.${propertyId}`, body);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: data?.[0], success: true } })); return;
    }

    if (propertyId && req.method === "DELETE") {
      await supabaseDelete("listed_properties", `?id=eq.${propertyId}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { success: true } })); return;
    }

    if (url === "/api/hero" && req.method === "GET") {
      let data = await supabaseGet("listed_properties", "?show_in_hero=eq.true&is_published=eq.true&limit=1");
      if (!data?.[0]) data = await supabaseGet("listed_properties", "?listing_type=eq.featured&is_published=eq.true&limit=1");
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: data?.[0] || null } })); return;
    }

    const propertySlug = matchRoute(url, "/api/property/:slug");
    if (propertySlug && req.method === "GET") {
      const data = await supabaseGet("listed_properties", `?slug=eq.${propertySlug}&limit=1`);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: data?.[0] || null } })); return;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CMS PROPERTIES
    // ═══════════════════════════════════════════════════════════════

    if (url.startsWith("/api/cms/properties") && req.method === "GET" && !matchRoute(url, "/api/cms/properties/:slug")) {
      const data = await supabaseGet("listed_properties", "?order=id.asc");
      const mapped = (data || []).map(row => ({
        _id: String(row.id), title: row.title, slug: row.slug,
        excerpt: row.short_description || "", content: row.description || "",
        coverImage: row.featured_image || "", status: row.is_published ? "published" : "draft",
        category: row.property_category || "", location: row.location || "",
        price: row.price || 0, bedrooms: row.bedrooms || "", bathrooms: row.bathrooms || "",
        developer: row.developer_name || "", listingType: row.listing_type || "normal",
        soldOut: row.sold_out || false, hidden: row.hidden || false,
        showInHero: row.show_in_hero || false, isNewLaunch: row.is_new_launch || false,
        goldenVisaEligible: row.golden_visa_eligible || false,
        publishStatus: row.is_published ? "published" : "draft",
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      }));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: mapped })); return;
    }

    if (url === "/api/cms/properties" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.slug && body.title) body.slug = generateSlug(body.title);
      const data = await supabasePost("listed_properties", body);
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(data[0].id), ...data[0] } })); return;
    }

    const cmsSlug = matchRoute(url, "/api/cms/properties/:slug");
    if (cmsSlug && req.method === "PUT") {
      const body = await parseBody(req);
      const data = await supabasePatch("listed_properties", `?slug=eq.${cmsSlug}`, body);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(data[0].id), ...data[0] } })); return;
    }
    if (cmsSlug && req.method === "DELETE") {
      await supabaseDelete("listed_properties", `?slug=eq.${cmsSlug}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true })); return;
    }

    // ═══════════════════════════════════════════════════════════════
    //  BLOG POSTS
    // ═══════════════════════════════════════════════════════════════

    if (url.startsWith("/api/cms/blogs") && req.method === "GET" && !matchRoute(url, "/api/cms/blogs/:slug")) {
      const data = await supabaseGet("blog_posts", "?order=created_at.desc");
      const mapped = (data || []).map(row => ({
        _id: String(row.id), title: row.title, slug: row.slug,
        excerpt: row.excerpt || "", content: row.content || "",
        coverImage: row.featured_image || "", status: row.status || "draft",
        category: row.category || "", tags: row.tags || [],
        author: row.author || "3G Real Estate",
        publishedAt: row.published_at, createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      }));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: mapped })); return;
    }

    const blogSlug = matchRoute(url, "/api/cms/blogs/:slug");
    if (blogSlug && req.method === "GET") {
      const data = await supabaseGet("blog_posts", `?slug=eq.${blogSlug}&limit=1`);
      const row = data?.[0];
      res.writeHead(200, cors);
      res.end(JSON.stringify({ success: true, data: row ? {
        _id: String(row.id), title: row.title, slug: row.slug,
        excerpt: row.excerpt || "", content: row.content || "",
        coverImage: row.featured_image || "", status: row.status || "draft",
        category: row.category || "", tags: row.tags || [],
        author: row.author || "3G Real Estate",
        publishedAt: row.published_at, createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      } : null })); return;
    }

    if (url === "/api/cms/blogs" && req.method === "POST") {
      const body = await parseBody(req);
      const insertData = {
        title: body.title, slug: body.slug || generateSlug(body.title),
        excerpt: body.excerpt || "", content: body.content || "",
        category: body.category || "", tags: body.tags || [],
        featured_image: body.coverImage || body.featured_image || "",
        status: body.status || "draft",
        published_at: body.status === "published" ? new Date().toISOString() : null,
      };
      const data = await supabasePost("blog_posts", insertData);
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(data[0].id), ...data[0] } })); return;
    }

    if (blogSlug && req.method === "PUT") {
      const body = await parseBody(req);
      const updateData = {
        title: body.title, slug: body.slug, excerpt: body.excerpt || "",
        content: body.content || "", category: body.category || "", tags: body.tags || [],
        featured_image: body.coverImage || body.featured_image || "",
        status: body.status || "draft",
      };
      const data = await supabasePatch("blog_posts", `?slug=eq.${blogSlug}`, updateData);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(data[0].id), ...data[0] } })); return;
    }

    if (blogSlug && req.method === "DELETE") {
      await supabaseDelete("blog_posts", `?slug=eq.${blogSlug}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true })); return;
    }

    // ═══════════════════════════════════════════════════════════════
    //  COMMUNITIES
    // ═══════════════════════════════════════════════════════════════

    if (url.startsWith("/api/cms/communities") && req.method === "GET" && !matchRoute(url, "/api/cms/communities/:slug")) {
      const data = await supabaseGet("communities", "?order=name.asc");
      const mapped = (data || []).map(row => ({
        _id: String(row.id), name: row.name, slug: row.slug,
        category: row.category || "", description: row.description || "",
        longDescription: row.long_description || "", priceRange: row.price_range || "",
        avgPricePerSqft: row.avg_price_per_sqft || "", rentalYield: row.rental_yield || "",
        propertyTypes: row.property_types || [], developer: row.developer || "",
        image: row.image || "", isPublished: row.is_published !== false,
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      }));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: mapped })); return;
    }

    const communitySlug = matchRoute(url, "/api/cms/communities/:slug");
    if (communitySlug && req.method === "GET") {
      const data = await supabaseGet("communities", `?slug=eq.${communitySlug}&limit=1`);
      const row = data?.[0];
      res.writeHead(200, cors);
      res.end(JSON.stringify({ success: true, data: row ? {
        _id: String(row.id), name: row.name, slug: row.slug,
        category: row.category || "", description: row.description || "",
        longDescription: row.long_description || "", priceRange: row.price_range || "",
        avgPricePerSqft: row.avg_price_per_sqft || "", rentalYield: row.rental_yield || "",
        propertyTypes: row.property_types || [], developer: row.developer || "",
        image: row.image || "", isPublished: row.is_published !== false,
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      } : null })); return;
    }

    if (url === "/api/cms/communities" && req.method === "POST") {
      const body = await parseBody(req);
      const insertData = {
        name: body.name, slug: body.slug || generateSlug(body.name),
        category: body.category || "", description: body.description || "",
        long_description: body.longDescription || "", price_range: body.priceRange || "",
        avg_price_per_sqft: body.avgPricePerSqft || "", rental_yield: body.rentalYield || "",
        property_types: body.propertyTypes || [], developer: body.developer || "",
        image: body.image || "", is_published: body.isPublished !== undefined ? body.isPublished : true,
      };
      const data = await supabasePost("communities", insertData);
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(data[0].id), ...data[0] } })); return;
    }

    if (communitySlug && req.method === "PUT") {
      const body = await parseBody(req);
      const updateData = {
        name: body.name, slug: body.slug, category: body.category || "",
        description: body.description || "", long_description: body.longDescription || "",
        price_range: body.priceRange || "", avg_price_per_sqft: body.avgPricePerSqft || "",
        rental_yield: body.rentalYield || "", property_types: body.propertyTypes || [],
        developer: body.developer || "", image: body.image || "",
        is_published: body.isPublished !== undefined ? body.isPublished : true,
      };
      const data = await supabasePatch("communities", `?slug=eq.${communitySlug}`, updateData);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(data[0].id), ...data[0] } })); return;
    }

    if (communitySlug && req.method === "DELETE") {
      await supabaseDelete("communities", `?slug=eq.${communitySlug}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true })); return;
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADMIN AUTH
    // ═══════════════════════════════════════════════════════════════

    if (url.startsWith("/api/admin") && req.method === "POST") {
      const body = await parseBody(req);
      const urlObj = new URL(url, `http://localhost`);
      const action = urlObj.searchParams.get("action") || body.action;

      if (action === "login") {
        const { username, password } = body;
        const user = ADMIN_USERS.find(u => u.username === username && u.password === password);
        if (!user) { res.writeHead(401, cors); res.end(JSON.stringify({ error: "Invalid credentials" })); return; }
        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;
        res.writeHead(200, cors);
        res.end(JSON.stringify({ token, user: { ...userWithoutPassword, hasWebsite: true, hasCrm: true, websiteFeatures: ["leads","agents_view","properties","communities","blogs"], crmFeatures: ["invoices","calculator","payroll","accounting","analytics","uae_services"] } }));
        return;
      }

      if (action === "me" || action === "users.list") {
        const users = ADMIN_USERS.map(u => {
          const { password: _, ...withoutPassword } = u;
          return { ...withoutPassword, hasWebsite: true, hasCrm: true, websiteFeatures: ["leads","agents_view","properties","communities","blogs"], crmFeatures: ["invoices","calculator","payroll","accounting","analytics","uae_services"] };
        });
        res.writeHead(200, cors); res.end(JSON.stringify({ users })); return;
      }

      if (action === "content.list") {
        const type = body.type || "all";
        const result = {};
        if (type === "all" || type === "property") result.properties = await supabaseGet("listed_properties", "?order=id.asc");
        if (type === "all" || type === "blog") result.blogs = await supabaseGet("blog_posts", "?order=created_at.desc");
        if (type === "all" || type === "community") result.communities = await supabaseGet("communities", "?order=name.asc");
        res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: result })); return;
      }

      if (action === "leads.list") {
        const data = await supabaseGet("download_requests", "?order=created_at.desc");
        const mapped = (data || []).map(row => ({
          id: String(row.id), name: row.name || "", email: row.email || "",
          phone: row.phone || "", interest: row.interest || "",
          source: row.source || "Website", status: row.status || "new",
          createdAt: row.created_at,
        }));
        res.writeHead(200, cors); res.end(JSON.stringify({ leads: mapped })); return;
      }

      res.writeHead(400, cors); res.end(JSON.stringify({ error: "Unknown action", action })); return;
    }

    if (url.startsWith("/api/admin") && req.method === "GET") {
      const urlObj = new URL(url, `http://localhost`);
      if (urlObj.searchParams.get("action") === "me") {
        const users = ADMIN_USERS.map(u => {
          const { password: _, ...withoutPassword } = u;
          return { ...withoutPassword, hasWebsite: true, hasCrm: true };
        });
        res.writeHead(200, cors); res.end(JSON.stringify({ user: users[0] })); return;
      }
      res.writeHead(400, cors); res.end(JSON.stringify({ error: "Unknown GET action" })); return;
    }

    // ═══════════════════════════════════════════════════════════════
    //  UPLOAD (stub)
    // ═══════════════════════════════════════════════════════════════

    if (url === "/api/upload" && req.method === "POST") {
      res.writeHead(200, cors);
      res.end(JSON.stringify({ success: true, url: "https://placehold.co/600x400?text=Uploaded", publicId: "placeholder" }));
      return;
    }

    // 404
    res.writeHead(404, cors);
    res.end(JSON.stringify({ error: "Not found", url, method: req.method }));

  } catch (err) {
    console.error("[API] Error:", err.message);
    res.writeHead(500, cors);
    res.end(JSON.stringify({ error: err.message }));
  }
};
