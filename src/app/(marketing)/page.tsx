import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

import { seedTeams } from "@/lib/fantasy-data";

const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function MarketingHome() {
  const featuredTeams = seedTeams.slice(0, 6);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        <div className="max-w-4xl">
          <div>
            <h1 className="mt-5 max-w-5xl font-sans text-[4rem] uppercase leading-[0.9] tracking-[0.03em] text-white sm:text-[5.5rem]">
              Draft five nations. Draft six stars. Crown two champions.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-[var(--muted)]">
              Create a league, draft your pool, and track the tournament.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {hasClerkEnv ? (
                <>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button className="rounded-full bg-[var(--gold)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)] transition hover:brightness-105">
                        Create League
                      </button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <button className="rounded-full border border-[var(--line-strong)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white transition hover:border-white/70">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link
                      href="/dashboard"
                      className="rounded-full bg-[var(--gold)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)] transition hover:brightness-105"
                    >
                      Open Dashboard
                    </Link>
                  </SignedIn>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-full bg-[var(--gold)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)] transition hover:brightness-105"
                  >
                    Explore MVP
                  </Link>
                  <Link
                    href="/sign-in"
                    className="rounded-full border border-[var(--line-strong)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white transition hover:border-white/70"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <section className="mt-14 grid gap-6 border-t border-[var(--line)] pt-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.3em] text-[var(--gold)]">
              Rules
            </p>
            <p className="mt-3 text-base text-white">5 teams. 6 players. 11 rounds.</p>
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              {featuredTeams.map((team) => (
                <span
                  key={team.id}
                  className="rounded-full border border-white/10 px-3 py-2 font-sans text-xs uppercase tracking-[0.16em] text-white"
                >
                  {team.countryCode} · {team.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
