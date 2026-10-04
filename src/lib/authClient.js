import { createAuthClient } from "better-auth/react";

// Same-origin: the Worker serves both the site and /api/auth.
export const authClient = createAuthClient({ basePath: "/api/auth" });
