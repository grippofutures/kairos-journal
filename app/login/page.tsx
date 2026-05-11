import { redirect } from "next/navigation";
import { signInWithDiscord } from "./actions";
import { Wordmark, Footer } from "@/components/Brand";
import { AnimatedMark } from "@/components/AnimatedMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const params = await searchParams;

  // Defensive: if Supabase landed an OAuth `code` here instead of /auth/callback
  // (happens when Site URL is misconfigured to include /login), forward it
  // straight to the proper handler so the user is not stranded on this page.
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }

  const errorMsg = params.error ? decodeURIComponent(params.error) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <AnimatedMark size={140} />
          </div>
          <Wordmark className="text-4xl block mb-4" />
          <div className="eyebrow mb-12">
            <span className="rule-gold mr-3" />
            Timing is everything
            <span className="rule-gold ml-3" />
          </div>

          <h1 className="font-display text-4xl mb-5 leading-tight">
            Welcome back.
          </h1>
          <p className="text-bone-dim text-sm mb-10 leading-relaxed max-w-sm mx-auto">
            Sign in with Discord. Your mentorship role grants access — there is nothing else to set up.
          </p>

          <form action={signInWithDiscord} className="max-w-xs mx-auto">
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-3"
            >
              <DiscordIcon />
              Sign in with Discord
            </button>
          </form>

          {errorMsg && (
            <p className="text-sm text-bone-dim mt-6 font-display italic leading-relaxed">
              {errorMsg}
            </p>
          )}

          <p className="text-[11px] tracking-eyebrow uppercase text-muted mt-12 font-display italic">
            Wait. Then act.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
