import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error?.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? "Could not authenticate")}`
    );
  }

  const { user, session } = data;
  const providerToken = session.provider_token;

  // Upsert user profile using the admin client so RLS doesn't block the write.
  // This is safe — we just exchanged a valid GitHub OAuth code so identity is confirmed.
  if (user) {
    const admin = createAdminClient();
    const githubUsername =
      user.user_metadata.preferred_username ??
      user.user_metadata.user_name ??
      user.email?.split("@")[0] ??
      "user";
    const displayName =
      user.user_metadata.full_name ?? user.user_metadata.name ?? githubUsername;
    const avatarUrl = user.user_metadata.avatar_url ?? "";

    const { error: upsertError } = await admin.from("users").upsert({
      id: user.id,
      github_username: githubUsername,
      display_name: displayName,
      avatar_url: avatarUrl,
      github_token: providerToken ?? "",
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      // Non-fatal: log it but don't block sign-in. The session is valid.
      console.warn("[auth/callback] User profile upsert warning:", upsertError.message);
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
}
