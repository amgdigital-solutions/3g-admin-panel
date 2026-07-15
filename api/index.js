// 3G Real Estate API - Zero dependencies, Node.js 20 native fetch
// Connects to Supabase REST API directly

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

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

async function supabaseRequest(table, method, query, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ""}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
  if (method === "POST" || method === "PATCH") {
    headers["Prefer"] = "return=representation";
  }
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();

  if (!res.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message || parsed.error || JSON.stringify(parsed);
    } catch { /* use raw text */ }
    const err = new Error(`Supabase ${method} error (${res.status}): ${detail}`);
    err.status = res.status;
    err.supabaseMessage = detail;
    throw err;
  }
  return text ? JSON.parse(text) : [];
}

const ADMIN_USERS = [
  { id: "admin-1", username: "admin", name: "Admin", email: "admin@3guae.com", role: "super_admin", password: "admin123" },
  { id: "admin-2", username: "qasim", name: "Qasim", email: "qasim@3guae.com", role: "super_admin", password: "qasim@3g123" },
];

function generateToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role, exp: Date.now() + 86400000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function mapProperty(body) {
  const images = body.images || [];
  const featuredImage = body.coverImage || body.featured_image || images[0] || "";
  const status = body.status || body.publishStatus || "draft";
  const mapped = {
    title: body.title || "",
    slug: body.slug || "",
    description: body.description || body.content || "",
    short_description: body.excerpt || body.short_description || (body.description || "").substring(0, 200),
    featured_image: featuredImage,
    is_published: status === "published" || status === true,
    property_category: body.property_type || body.category || "Apartment",
    location: body.location || "",
    price: body.price || 0,
    price_display: body.price_display || "",
    bedrooms: body.bedrooms || 0,
    bathrooms: body.bathrooms || 0,
    listing_type: body.listingType || body.listing_type || "normal",
    sold_out: body.soldOut || body.sold_out || false,
    hidden: body.hidden || false,
    show_in_hero: body.showInHero || body.show_in_hero || body.featured || false,
    is_new_launch: body.isNewLaunch || body.is_new_launch || false,
    golden_visa_eligible: body.goldenVisaEligible || body.golden_visa_eligible || false,
    barcode: body.barcode || "",
    area_sqft: body.area_sqft || 0,
    parking: body.parking || 0,
    amenities: body.amenities || [],
    meta_title: body.meta_title || "",
    meta_description: body.meta_description || "",
    focus_keywords: body.focus_keywords || "",
    faqs: body.faqs || [],
  };
  // Only include developer_name if user has this column in their Supabase table
  // If Supabase throws "could not find developer_name", this field is not included
  if (body.developer || body.developer_name) {
    mapped.developer_name = body.developer || body.developer_name;
  }
  return mapped;
}

function mapBlog(body, isCreate) {
  const status = body.status || "draft";
  const data = {
    title: body.title || "",
    slug: body.slug || "",
    excerpt: body.excerpt || "",
    content: body.content || "",
    category: body.category || "",
    tags: body.tags || [],
    featured_image: body.coverImage || body.featured_image || "",
    status: status,
    author: body.author_name || body.author || "3G Real Estate",
  };
  if (isCreate && status === "published") {
    data.published_at = new Date().toISOString();
  }
  return data;
}

function mapCommunity(body) {
  const status = body.status || "draft";
  return {
    name: body.name || "",
    slug: body.slug || "",
    description: body.description || "",
    short_description: body.short_description || (body.description || "").substring(0, 200),
    long_description: body.longDescription || body.long_description || body.description || "",
    location: body.location || "",
    price_range: body.priceRange || body.price_range || body.avg_price || "",
    avg_price_per_sqft: body.avgPricePerSqft || body.avg_price_per_sqft || "",
    rental_yield: body.rentalYield || body.rental_yield || "",
    property_types: body.propertyTypes || body.property_types || [],
    developer: body.developer || "",
    image: body.image || "",
    gallery: body.gallery || [],
    is_published: status === "published" || body.isPublished === true,
    category: body.category || "",
    amenities: body.amenities || [],
  };
}

async function safeDbCall(req, res, operation) {
  try {
    return await operation();
  } catch (err) {
    console.error(`[API] Error on ${req.method} ${req.url}:`, err.supabaseMessage || err.message);
    res.writeHead(err.status || 500, cors);
    res.end(JSON.stringify({ success: false, error: err.supabaseMessage || err.message }));
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors); res.end(); return;
  }

  const url = req.url || "";

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
    res.end(JSON.stringify({ error: "Supabase not configured" }));
    return;
  }

  try {
    // PROPERTIES
    if (url === "/api/properties" && req.method === "GET") {
      const result = await supabaseRequest("listed_properties", "GET", "?is_published=eq.true&hidden=eq.false&order=id.asc");
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: result || [] } })); return;
    }

    const propertyId = matchRoute(url, "/api/properties/:id");
    if (propertyId && req.method === "GET") {
      const result = await supabaseRequest("listed_properties", "GET", `?id=eq.${propertyId}&limit=1`);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: result?.[0] || null } })); return;
    }

    if (url === "/api/properties" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.slug && body.title) body.slug = generateSlug(body.title);
      const result = await supabaseRequest("listed_properties", "POST", "", mapProperty(body));
      res.writeHead(201, cors); res.end(JSON.stringify({ result: { data: result?.[0], success: true } })); return;
    }

    if (propertyId && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await supabaseRequest("listed_properties", "PATCH", `?id=eq.${propertyId}`, mapProperty(body));
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: result?.[0], success: true } })); return;
    }

    if (propertyId && req.method === "DELETE") {
      await supabaseRequest("listed_properties", "DELETE", `?id=eq.${propertyId}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { success: true } })); return;
    }

    if (url === "/api/hero" && req.method === "GET") {
      let result = await supabaseRequest("listed_properties", "GET", "?show_in_hero=eq.true&is_published=eq.true&limit=1");
      if (!result?.[0]) result = await supabaseRequest("listed_properties", "GET", "?listing_type=eq.featured&is_published=eq.true&limit=1");
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: result?.[0] || null } })); return;
    }

    const propertySlug = matchRoute(url, "/api/property/:slug");
    if (propertySlug && req.method === "GET") {
      const result = await supabaseRequest("listed_properties", "GET", `?slug=eq.${propertySlug}&limit=1`);
      res.writeHead(200, cors); res.end(JSON.stringify({ result: { data: result?.[0] || null } })); return;
    }

    // CMS PROPERTIES
    const cmsPropSlug = matchRoute(url, "/api/cms/properties/:slug");

    if (url === "/api/cms/properties" && req.method === "GET") {
      const result = await supabaseRequest("listed_properties", "GET", "?order=id.asc");
      const mapped = (result || []).map(row => ({
        _id: String(row.id), title: row.title, slug: row.slug,
        excerpt: row.short_description || "", content: row.description || "",
        coverImage: row.featured_image || "", status: row.is_published ? "published" : "draft",
        category: row.property_category || "", location: row.location || "",
        price: row.price || 0, bedrooms: row.bedrooms || "", bathrooms: row.bathrooms || "",
        listingType: row.listing_type || "normal",
        soldOut: row.sold_out || false, hidden: row.hidden || false,
        showInHero: row.show_in_hero || false, isNewLaunch: row.is_new_launch || false,
        goldenVisaEligible: row.golden_visa_eligible || false,
        publishStatus: row.is_published ? "published" : "draft",
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      }));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: mapped })); return;
    }

    if (cmsPropSlug && req.method === "GET") {
      const result = await supabaseRequest("listed_properties", "GET", `?slug=eq.${cmsPropSlug}&limit=1`);
      const row = result?.[0];
      res.writeHead(200, cors);
      res.end(JSON.stringify({ success: true, data: row ? {
        _id: String(row.id), title: row.title, slug: row.slug,
        excerpt: row.short_description || "", content: row.description || "",
        coverImage: row.featured_image || "", status: row.is_published ? "published" : "draft",
        category: row.property_category || "", location: row.location || "",
        price: row.price || 0, bedrooms: row.bedrooms || "", bathrooms: row.bathrooms || "",
        listingType: row.listing_type || "normal",
        soldOut: row.sold_out || false, hidden: row.hidden || false,
        showInHero: row.show_in_hero || false, isNewLaunch: row.is_new_launch || false,
        goldenVisaEligible: row.golden_visa_eligible || false,
        publishStatus: row.is_published ? "published" : "draft",
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      } : null })); return;
    }

    if (url === "/api/cms/properties" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.slug && body.title) body.slug = generateSlug(body.title);
      const result = await supabaseRequest("listed_properties", "POST", "", mapProperty(body));
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (cmsPropSlug && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await supabaseRequest("listed_properties", "PATCH", `?slug=eq.${cmsPropSlug}`, mapProperty(body));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (cmsPropSlug && req.method === "DELETE") {
      await supabaseRequest("listed_properties", "DELETE", `?slug=eq.${cmsPropSlug}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true })); return;
    }

    // BLOG POSTS
    if (url === "/api/cms/blogs" && req.method === "GET") {
      const result = await supabaseRequest("blog_posts", "GET", "?order=created_at.desc");
      const mapped = (result || []).map(row => ({
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
      const result = await supabaseRequest("blog_posts", "GET", `?slug=eq.${blogSlug}&limit=1`);
      const row = result?.[0];
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
      const result = await supabaseRequest("blog_posts", "POST", "", mapBlog(body, true));
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (blogSlug && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await supabaseRequest("blog_posts", "PATCH", `?slug=eq.${blogSlug}`, mapBlog(body));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (blogSlug && req.method === "DELETE") {
      await supabaseRequest("blog_posts", "DELETE", `?slug=eq.${blogSlug}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true })); return;
    }

    // COMMUNITIES
    if (url === "/api/cms/communities" && req.method === "GET") {
      const result = await supabaseRequest("communities", "GET", "?order=name.asc");
      const mapped = (result || []).map(row => ({
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
      const result = await supabaseRequest("communities", "GET", `?slug=eq.${communitySlug}&limit=1`);
      const row = result?.[0];
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
      const result = await supabaseRequest("communities", "POST", "", mapCommunity(body));
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (communitySlug && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await supabaseRequest("communities", "PATCH", `?slug=eq.${communitySlug}`, mapCommunity(body));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (communitySlug && req.method === "DELETE") {
      await supabaseRequest("communities", "DELETE", `?slug=eq.${communitySlug}`);
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true })); return;
    }

    // DOWNLOAD REQUESTS
    if (url.startsWith("/api/download-requests") && req.method === "GET") {
      const urlObj = new URL(url, `http://localhost`);
      const action = urlObj.searchParams.get("action") || "list";
      if (action === "list") {
        const result = await supabaseRequest("download_requests", "GET", "?order=created_at.desc");
        const mapped = (result || []).map(row => ({
          id: String(row.id), name: row.name || "", email: row.email || "",
          phone: row.phone || "", interest: row.interest || "",
          source: row.source || "Website", status: row.status || "new",
          createdAt: row.created_at,
        }));
        res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: mapped })); return;
      }
      res.writeHead(400, cors); res.end(JSON.stringify({ error: "Unknown action" })); return;
    }

    // ADMIN AUTH
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
          const { password: pwd, ...withoutPassword } = u;
          return { ...withoutPassword, hasWebsite: true, hasCrm: true, websiteFeatures: ["leads","agents_view","properties","communities","blogs"], crmFeatures: ["invoices","calculator","payroll","accounting","analytics","uae_services"] };
        });
        res.writeHead(200, cors); res.end(JSON.stringify({ users })); return;
      }

      if (action === "content.list") {
        const type = body.type || "all";
        const result = {};
        if (type === "all" || type === "property") result.properties = await supabaseRequest("listed_properties", "GET", "?order=id.asc");
        if (type === "all" || type === "blog") result.blogs = await supabaseRequest("blog_posts", "GET", "?order=created_at.desc");
        if (type === "all" || type === "community") result.communities = await supabaseRequest("communities", "GET", "?order=name.asc");
        res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: result })); return;
      }

      if (action === "leads.list") {
        const data = await supabaseRequest("download_requests", "GET", "?order=created_at.desc");
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
          const { password: pwd, ...withoutPassword } = u;
          return { ...withoutPassword, hasWebsite: true, hasCrm: true };
        });
        res.writeHead(200, cors); res.end(JSON.stringify({ user: users[0] })); return;
      }
      res.writeHead(400, cors); res.end(JSON.stringify({ error: "Unknown GET action" })); return;
    }

    if (url === "/api/upload" && req.method === "POST") {
      res.writeHead(200, cors);
      res.end(JSON.stringify({ success: true, url: "https://placehold.co/600x400?text=Uploaded", publicId: "placeholder" }));
      return;
    }

    res.writeHead(404, cors);
    res.end(JSON.stringify({ error: "Not found", url, method: req.method }));

  } catch (err) {
    console.error("[API] Error:", err.message);
    res.writeHead(500, cors);
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
