import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

import { getFlagEmojiFromCode, seedTeams } from "@/lib/fantasy-data";
import { getDashboardLeagues, getPersistenceState, syncCurrentUser } from "@/lib/db";

const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default async function MarketingHome() {
  const { userId } = await auth();
  const featuredTeams = seedTeams.slice(0, 6);
  const signedIn = Boolean(userId);
  let leagues: Awaited<ReturnType<typeof getDashboardLeagues>> = [];
  let homeError: string | null = null;

  if (signedIn && userId) {
    const persistence = await getPersistenceState();
    if (persistence.available) {
      try {
        const appUser = await syncCurrentUser();
        leagues = appUser ? await getDashboardLeagues(userId) : [];
      } catch (error) {
        homeError =
          error instanceof Error ? error.message : "Unable to load your leagues right now.";
      }
    }
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        <div className="max-w-4xl">
          <div>
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[var(--gold)]">
              {signedIn ? "League Overview" : "World Cup 2026"}
            </p>
            <h1 className="mt-5 max-w-5xl font-sans text-[4rem] uppercase leading-[0.9] tracking-[0.03em] text-white sm:text-[5.5rem]">
              {signedIn ? "Your league at a glance." : "Draft five nations. Crown the champion."}
            </h1>
            <p className="mt-5 max-w-2xl text-base text-[var(--muted)]">
              {signedIn
                ? "Jump back into a league or open admin."
                : "Create a league, draft your pool, and track the tournament."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {signedIn ? (
                <>
                  <Link
                    href={leagues[0] ? `/leagues/${leagues[0].id}` : "/dashboard"}
                    className="rounded-full bg-[var(--gold)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)] transition hover:brightness-105"
                  >
                    {leagues[0] ? "Open League" : "Open Admin"}
                  </Link>
                  {leagues[0] ? (
                    <Link
                      href="/dashboard"
                      className="rounded-full border border-[var(--line-strong)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white transition hover:border-white/70"
                    >
                      Open Admin
                    </Link>
                  ) : null}
                </>
              ) : hasClerkEnv ? (
                <>
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

        {homeError ? (
          <section className="mt-10 border-t border-[var(--danger)] px-1 py-4 text-sm leading-7 text-white">
            {homeError}
          </section>
        ) : null}

        {signedIn ? (
          <section className="mt-14 border-t border-[var(--line)] pt-6">
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Your League
            </p>
            <div className="mt-4 space-y-4">
              {!leagues[0] ? (
                <div className="border-t border-white/10 pt-4 text-sm leading-7 text-[var(--muted)]">
                  No leagues yet.
                </div>
              ) : (
                <Link
                  href={`/leagues/${leagues[0].id}`}
                  className="block border-t border-white/10 py-4 transition hover:border-white/25"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">
                      {leagues[0].name}
                    </h2>
                    <span className="rounded-full border border-white/10 px-3 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                      {leagues[0].status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
                    <span>{leagues[0].memberCount} / {leagues[0].maxMembers} members</span>
                    <span>Code: {leagues[0].inviteCode}</span>
                  </div>
                </Link>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-14 border-t border-[var(--line)] pt-6">
            <div className="flex flex-wrap gap-2">
              {featuredTeams.map((team) => (
                <span
                  key={team.id}
                  className="rounded-full border border-white/10 px-3 py-2 font-sans text-xs uppercase tracking-[0.16em] text-white"
                >
                  {getFlagEmojiFromCode(team.countryCode)} {team.name}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
