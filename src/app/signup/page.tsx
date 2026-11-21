import Link from "next/link";
import { signUpAction } from "@/app/login/actions";
import { AppHeader } from "@/components/app-header";

type SignupPageProps = { searchParams: Promise<{ error?: string; message?: string; next?: string }> };

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const next = params.next ?? "/create-profile";

  return (
    <main className="page-shell auth-shell">
      <AppHeader />
      <section className="auth-card" aria-labelledby="signup-title">
        <div className="auth-copy"><span>Detroit Connect</span><h1 id="signup-title">Create your account</h1><p>Join the trusted local network for Detroit profiles, resources, and community.</p></div>
        {params.error ? <div className="auth-alert">{params.error}</div> : null}
        {params.message ? <div className="auth-alert is-success">{params.message}</div> : null}
        <form className="auth-form" action={signUpAction}>
          <input name="next" type="hidden" value={next} />
          <label><span>Name</span><input autoComplete="name" maxLength={80} name="fullName" placeholder="Your name" required /></label>
          <label><span>Email</span><input autoComplete="email" name="email" placeholder="you@example.com" required type="email" /></label>
          <label><span>Password</span><input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
          <button className="primary-button" type="submit">Create account</button>
        </form>
        <p className="auth-switch">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
        <Link className="auth-link" href="/">Back to home</Link>
      </section>
    </main>
  );
}
