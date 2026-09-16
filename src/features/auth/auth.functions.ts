import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(40),
  password: z.string().min(1).max(256),
});

async function getPrivateEmail(username: string) {
  const bytes = new TextEncoder().encode(username.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `admin-${hash.slice(0, 24)}@academy.invalid`;
}

export const signInAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const configuredUsername = data.username.trim();

    const email = await getPrivateEmail(configuredUsername);

    // Try Supabase admin auth if available
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 100,
      });

      if (!usersError && usersData?.users) {
        let adminUser = usersData.users.find((user) => user.email === email);
        if (!adminUser) {
          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: data.password,
            email_confirm: true,
          });
          if (!createError && created.user) {
            adminUser = created.user;
          }
        }

        if (adminUser) {
          await supabaseAdmin.from("profiles").upsert({
            id: adminUser.id,
            username: configuredUsername,
          });

          const { createClient } = await import("@supabase/supabase-js");
          const publicKey = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
          const backendUrl = process.env["SUPABASE_URL"] ?? "";
          if (publicKey && backendUrl) {
            const authClient = createClient(backendUrl, publicKey, {
              auth: { persistSession: false, autoRefreshToken: false },
            });
            const { data: sessionData, error: signInError } =
              await authClient.auth.signInWithPassword({
                email,
                password: data.password,
              });

            if (!signInError && sessionData?.session) {
              return {
                ok: true as const,
                accessToken: sessionData.session.access_token,
                refreshToken: sessionData.session.refresh_token,
                user: {
                  id: adminUser.id,
                  email,
                  username: configuredUsername,
                  role: "admin",
                },
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Auth] Supabase admin sign-in bypassed or unavailable:", err);
    }

    return {
      ok: false as const,
    };
  });
