import Link from "next/link";
import { resetPasswordAction } from "@/app/login/actions";
import { AppHeader } from "@/components/app-header";

type ForgotPasswordPageProps = { searchParams: Promise<{ error?: string; message?: string; email?: string }> };

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  return (
    <main className="page-shell auth-shell">
      <AppHeader />
      <section className="auth-card" aria-labelledby="forgot-password-title">
        <div className="auth-copy"><span>Detroit Connect</span><h1 id="forgot-password-title">Reset your password</h1><p>Enter the email you used to create your account and we’ll send a secure reset link.</p></div>
        {params.error ? <div className="auth-alert">{params.error}</div> : null}
        {params.message ? <div className="auth-alert is-success">{params.message}</div> : null}
        <form className="auth-form" action={resetPasswordAction}>
          <label><span>Email</span><input autoComplete="email" defaultValue={params.email ?? ""} name="email" placeholder="you@example.com" required type="email" /></label>
          <button className="primary-button" type="submit">Email me a reset link</button>
        </form>
        <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
        <Link className="auth-link" href="/">Back to home</Link>
      </section>
    </main>
  );
}
