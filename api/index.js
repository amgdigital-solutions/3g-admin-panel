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

// Retry helper: if Supabase complains about a missing column, remove it and retry
async function safeUpsert(table, method, query, mappedBody, maxRetries = 5) {
  let body = { ...mappedBody };
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await supabaseRequest(table, method, query, body);
    } catch (err) {
      lastError = err;
      // Extract column name from error like: "Could not find the 'featured_image' column"
      const colMatch = err.supabaseMessage?.match(/Could not find the '([^']+)' column/);
      if (colMatch) {
        const badCol = colMatch[1];
        if (body[badCol] !== undefined) {
          console.log(`[API] Column '${badCol}' not found in ${table}, removing and retrying...`);
          delete body[badCol];
          continue; // retry without this column
        }
      }
      // If error is not about missing column, or column already removed, throw
      throw err;
    }
  }
  throw lastError;
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
  const mapped = {};

  // Core fields
  if (body.title !== undefined) mapped.title = body.title;
  if (body.slug !== undefined) mapped.slug = body.slug;
  if (body.description !== undefined || body.content !== undefined) mapped.description = body.description || body.content || "";
  if (body.excerpt !== undefined || body.short_description !== undefined) mapped.short_description = body.excerpt || body.short_description || "";

  // Images - only if there's an actual URL
  if (featuredImage) mapped.featured_image = featuredImage;
  if (images.length > 0) mapped.images = images;

  // Status & flags
  mapped.is_published = status === "published" || status === true;
  if (body.property_type || body.category) mapped.property_category = body.property_type || body.category || "Apartment";
  if (body.location !== undefined) mapped.location = body.location;
  if (body.price !== undefined) mapped.price = body.price;
  if (body.price_display !== undefined) mapped.price_display = body.price_display;
  if (body.bedrooms !== undefined) mapped.bedrooms = body.bedrooms;
  if (body.bathrooms !== undefined) mapped.bathrooms = body.bathrooms;

  // Developer - only if provided
  if (body.developer || body.developer_name) mapped.developer_name = body.developer || body.developer_name;

  // Optional flags - always set show_in_hero so it can be toggled off
  if (body.listingType || body.listing_type) mapped.listing_type = body.listingType || body.listing_type;
  if (body.soldOut || body.sold_out) mapped.sold_out = true;
  if (body.hidden) mapped.hidden = true;
  // FIX: Always set show_in_hero based on featured value (can be true or false)
  mapped.show_in_hero = !!(body.showInHero || body.show_in_hero || body.featured);
  if (body.isNewLaunch || body.is_new_launch) mapped.is_new_launch = true;
  if (body.goldenVisaEligible || body.golden_visa_eligible) mapped.golden_visa_eligible = true;

  // Optional metadata - only if provided
  if (body.barcode) mapped.barcode = body.barcode;
  if (body.area_sqft !== undefined) mapped.area_sqft = body.area_sqft;
  if (body.parking !== undefined) mapped.parking = body.parking;
  if (body.amenities?.length) mapped.amenities = body.amenities;
  if (body.meta_title) mapped.meta_title = body.meta_title;
  if (body.meta_description) mapped.meta_description = body.meta_description;
  if (body.focus_keywords) mapped.focus_keywords = body.focus_keywords;
  if (body.faqs?.length) mapped.faqs = body.faqs;

  // NEW FIELDS: Investment & project info
  if (body.handover_date !== undefined) mapped.handover_date = body.handover_date || null;
  if (body.expected_roi !== undefined) mapped.expected_roi = body.expected_roi || null;
  if (body.rental_yield !== undefined) mapped.rental_yield = body.rental_yield || null;
  if (body.payment_plan !== undefined) mapped.payment_plan = body.payment_plan || null;
  if (body.project_status !== undefined) mapped.project_status = body.project_status || null;

  return mapped;
}

function mapBlog(body, isCreate) {
  const status = body.status || "draft";
  const data = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.content !== undefined) data.content = body.content;
  if (body.category !== undefined) data.category = body.category;
  if (body.tags?.length) data.tags = body.tags;
  if (body.coverImage || body.featured_image) data.featured_image = body.coverImage || body.featured_image;
  if (status) data.status = status;
  if (body.author_name || body.author) data.author = body.author_name || body.author || "3G Real Estate";
  if (isCreate && status === "published") {
    data.published_at = new Date().toISOString();
  }
  return data;
}

function mapCommunity(body) {
  const status = body.status || "draft";
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.description !== undefined) data.description = body.description;
  if (body.short_description !== undefined) data.short_description = body.short_description;
  if (body.longDescription || body.long_description) data.long_description = body.longDescription || body.long_description;
  if (body.location !== undefined) data.location = body.location;
  if (body.priceRange || body.price_range) data.price_range = body.priceRange || body.price_range;
  if (body.avgPricePerSqft || body.avg_price_per_sqft) data.avg_price_per_sqft = body.avgPricePerSqft || body.avg_price_per_sqft;
  if (body.rentalYield || body.rental_yield) data.rental_yield = body.rental_yield || body.rental_yield;
  if (body.propertyTypes?.length || body.property_types?.length) data.property_types = body.propertyTypes || body.property_types;
  if (body.developer) data.developer = body.developer;
  if (body.image) data.image = body.image;
  if (body.gallery?.length) data.gallery = body.gallery;
  data.is_published = status === "published" || body.isPublished === true;
  if (body.category !== undefined) data.category = body.category;
  if (body.amenities?.length) data.amenities = body.amenities;
  return data;
}

// SITE SETTINGS helpers
function mapSiteSettings(row) {
  return {
    ga4Id: row.ga4_id || "",
    gtmId: row.gtm_id || "",
    fbPixelId: row.fb_pixel_id || "",
    metaVerification: row.meta_verification || "",
    hotjarId: row.hotjar_id || "",
    customHead: row.custom_head || "",
    customBody: row.custom_body || "",
  };
}

function mapSiteSettingsToDb(body) {
  const data = {};
  if (body.ga4Id !== undefined) data.ga4_id = body.ga4Id;
  if (body.gtmId !== undefined) data.gtm_id = body.gtmId;
  if (body.fbPixelId !== undefined) data.fb_pixel_id = body.fbPixelId;
  if (body.metaVerification !== undefined) data.meta_verification = body.metaVerification;
  if (body.hotjarId !== undefined) data.hotjar_id = body.hotjarId;
  if (body.customHead !== undefined) data.custom_head = body.customHead;
  if (body.customBody !== undefined) data.custom_body = body.customBody;
  data.updated_at = new Date().toISOString();
  return data;
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
    // SITE SETTINGS
    if (url === "/api/site-settings" && req.method === "GET") {
      try {
        const result = await supabaseRequest("site_settings", "GET", "?limit=1");
        const row = result?.[0];
        res.writeHead(200, cors);
        res.end(JSON.stringify({
          success: true,
          dbAvailable: true,
          data: row ? mapSiteSettings(row) : {},
        }));
        return;
      } catch (err) {
        const isMissingTable = err.supabaseMessage?.includes("site_settings") ||
                               err.supabaseMessage?.includes("does not exist") ||
                               err.status === 404;
        if (isMissingTable) {
          res.writeHead(200, cors);
          res.end(JSON.stringify({
            success: true,
            dbAvailable: false,
            data: {},
            message: "site_settings table not found. Run the SQL to create it.",
          }));
          return;
        }
        throw err;
      }
    }

    if (url === "/api/site-settings" && req.method === "POST") {
      const body = await parseBody(req);
      const dbBody = mapSiteSettingsToDb(body);
      try {
        // FIX: Check if row exists first, then PATCH or INSERT accordingly
        let result;
        try {
          const existing = await supabaseRequest("site_settings", "GET", "?id=eq.1&limit=1");
          if (existing && existing.length > 0) {
            // Row exists → PATCH
            result = await supabaseRequest("site_settings", "PATCH", "?id=eq.1", dbBody);
          } else {
            // No row → INSERT
            result = await supabaseRequest("site_settings", "POST", "", { id: 1, ...dbBody });
          }
        } catch {
          // If GET fails somehow, try INSERT as fallback
          result = await supabaseRequest("site_settings", "POST", "", { id: 1, ...dbBody });
        }
        res.writeHead(200, cors);
        res.end(JSON.stringify({
          success: true,
          data: result?.[0] ? mapSiteSettings(result[0]) : body,
        }));
        return;
      } catch (err) {
        const isMissingTable = err.supabaseMessage?.includes("site_settings") ||
                               err.supabaseMessage?.includes("does not exist");
        if (isMissingTable) {
          res.writeHead(503, cors);
          res.end(JSON.stringify({
            success: false,
            error: "site_settings table not found. Run the SQL to create it in Supabase.",
          }));
          return;
        }
        throw err;
      }
    }

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
      const result = await safeUpsert("listed_properties", "POST", "", mapProperty(body));
      res.writeHead(201, cors); res.end(JSON.stringify({ result: { data: result?.[0], success: true } })); return;
    }

    if (propertyId && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await safeUpsert("listed_properties", "PATCH", `?id=eq.${propertyId}`, mapProperty(body));
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
        area_sqft: row.area_sqft || "", parking: row.parking || "",
        developer: row.developer_name || "", developer_name: row.developer_name || "",
        listingType: row.listing_type || "normal",
        soldOut: row.sold_out || false, hidden: row.hidden || false,
        showInHero: row.show_in_hero || false, isNewLaunch: row.is_new_launch || false,
        goldenVisaEligible: row.golden_visa_eligible || false,
        publishStatus: row.is_published ? "published" : "draft",
        // NEW FIELDS
        handover_date: row.handover_date || "",
        expected_roi: row.expected_roi || "",
        rental_yield: row.rental_yield || "",
        payment_plan: row.payment_plan || "",
        project_status: row.project_status || "",
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      }));
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: mapped })); return;
    }

    // FIX: CMS GET by ID (numeric) — frontend sends /api/cms/properties/123
    if (cmsPropSlug && req.method === "GET") {
      const slugOrId = cmsPropSlug;
      let result;
      // Try by slug first, then by numeric id
      result = await supabaseRequest("listed_properties", "GET", `?slug=eq.${slugOrId}&limit=1`);
      if (!result?.[0] && /^\d+$/.test(slugOrId)) {
        result = await supabaseRequest("listed_properties", "GET", `?id=eq.${slugOrId}&limit=1`);
      }
      const row = result?.[0];
      res.writeHead(200, cors);
      res.end(JSON.stringify({ success: true, data: row ? {
        _id: String(row.id), title: row.title, slug: row.slug,
        excerpt: row.short_description || "", content: row.description || "",
        coverImage: row.featured_image || "", status: row.is_published ? "published" : "draft",
        category: row.property_category || "", location: row.location || "",
        price: row.price || 0, bedrooms: row.bedrooms || "", bathrooms: row.bathrooms || "",
        area_sqft: row.area_sqft || "", parking: row.parking || "",
        developer: row.developer_name || "", developer_name: row.developer_name || "",
        listingType: row.listing_type || "normal",
        soldOut: row.sold_out || false, hidden: row.hidden || false,
        showInHero: row.show_in_hero || false, isNewLaunch: row.is_new_launch || false,
        goldenVisaEligible: row.golden_visa_eligible || false,
        publishStatus: row.is_published ? "published" : "draft",
        // NEW FIELDS
        handover_date: row.handover_date || "",
        expected_roi: row.expected_roi || "",
        rental_yield: row.rental_yield || "",
        payment_plan: row.payment_plan || "",
        project_status: row.project_status || "",
        createdAt: row.created_at, updatedAt: row.updated_at, ...row,
      } : null })); return;
    }

    if (url === "/api/cms/properties" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.slug && body.title) body.slug = generateSlug(body.title);
      const result = await safeUpsert("listed_properties", "POST", "", mapProperty(body));
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (cmsPropSlug && req.method === "PUT") {
      const body = await parseBody(req);
      // FIX: Try by slug first, then by numeric id for PUT
      let result;
      try {
        result = await safeUpsert("listed_properties", "PATCH", `?slug=eq.${cmsPropSlug}`, mapProperty(body));
      } catch (err) {
        if (/^\d+$/.test(cmsPropSlug)) {
          result = await safeUpsert("listed_properties", "PATCH", `?id=eq.${cmsPropSlug}`, mapProperty(body));
        } else {
          throw err;
        }
      }
      res.writeHead(200, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (cmsPropSlug && req.method === "DELETE") {
      try {
        await supabaseRequest("listed_properties", "DELETE", `?slug=eq.${cmsPropSlug}`);
      } catch (err) {
        if (/^\d+$/.test(cmsPropSlug)) {
          await supabaseRequest("listed_properties", "DELETE", `?id=eq.${cmsPropSlug}`);
        } else {
          throw err;
        }
      }
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
      const result = await safeUpsert("blog_posts", "POST", "", mapBlog(body, true));
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (blogSlug && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await safeUpsert("blog_posts", "PATCH", `?slug=eq.${blogSlug}`, mapBlog(body));
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
      const result = await safeUpsert("communities", "POST", "", mapCommunity(body));
      res.writeHead(201, cors); res.end(JSON.stringify({ success: true, data: { _id: String(result[0].id), ...result[0] } })); return;
    }

    if (communitySlug && req.method === "PUT") {
      const body = await parseBody(req);
      const result = await safeUpsert("communities", "PATCH", `?slug=eq.${communitySlug}`, mapCommunity(body));
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
