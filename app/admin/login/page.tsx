import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SiteHeader from "@/app/components/SiteHeader";

async function login(formData: FormData) {
  "use server";

  const token = String(formData.get("token") || "");
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected || token !== expected) redirect("/admin/login?error=1");

  const store = await cookies();
  store.set("aibid_admin", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="shell">
      <SiteHeader />
      <section className="form">
        <div className="eyebrow">Protected admin</div>
        <h1>Moderation</h1>
        <p className="muted" style={{ whiteSpace: "normal", lineHeight: 1.7 }}>
          Use the server-side admin token configured for this deployment. The token is never sent to the browser as page content.
        </p>
        <form action={login}>
          <div className="field">
            <label htmlFor="token">Admin token</label>
            <input id="token" name="token" type="password" autoComplete="current-password" required />
          </div>
          {error ? <p className="error">Invalid admin token.</p> : null}
          <button className="button primary button-lg" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
