import { createRouter, publicQuery } from "./middleware.js";
import { propertiesRouter } from "./routers/properties.js";
import { blogPostsRouter } from "./routers/blogPosts.js";
import { communitiesRouter } from "./routers/communities.js";
import { downloadRequestsRouter } from "./routers/downloadRequests.js";
import { statsRouter } from "./routers/stats.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  stats: statsRouter,
  properties: propertiesRouter,
  blogPosts: blogPostsRouter,
  communities: communitiesRouter,
  downloadRequests: downloadRequestsRouter,
});

export type AppRouter = typeof appRouter;
