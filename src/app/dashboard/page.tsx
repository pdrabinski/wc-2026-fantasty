import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createLeagueAction, joinLeagueAction } from "@/app/actions";
import { getDashboardLeagues, getPersistenceState, syncCurrentUser } from "@/lib/db";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const persistence = await getPersistenceState();
  let appUser = null;
  let leagues: Awaited<ReturnType<typeof getDashboardLeagues>> = [];
  let dashboardError: string | null = null;

  if (persistence.available) {
    try {
      appUser = await syncCurrentUser();
      leagues = appUser ? await getDashboardLeagues(userId) : [];
    } catch (error) {
      dashboardError =
        error instanceof Error ? error.message : "Unable to load your dashboard right now.";
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
        <div>
          <p className="font-sans text-[0.72rem] uppercase tracking-[0.3em] text-[var(--gold)]">
            Admin
          </p>
          <h1 className="mt-3 font-sans text-5xl uppercase tracking-[0.04em] text-white">
            Your leagues
          </h1>
        </div>
      </div>

      {params.error ? (
        <section className="mt-6 border-t border-[var(--danger)] px-1 py-4 text-sm leading-7 text-white">
          {params.error}
        </section>
      ) : null}

      {dashboardError ? (
        <section className="mt-6 border-t border-[var(--danger)] px-1 py-4 text-sm leading-7 text-white">
          {dashboardError}
        </section>
      ) : null}

      {!persistence.available ? (
        <section className="mt-6 border-t border-[var(--gold)] px-1 py-4 text-sm leading-7 text-white">
          Supabase is not ready yet. Run the SQL in{" "}
          <Link
            href="https://supabase.com/dashboard"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            `supabase/schema.sql`
          </Link>
          , then refresh.
          <br />
          <span className="text-[var(--muted)]">{persistence.reason}</span>
        </section>
      ) : null}

      {persistence.available && appUser ? (
        <>
          <section className="mt-8">
            <article className="border-t border-[var(--line)] pt-6">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                Your Leagues
              </p>
              <div className="mt-4 space-y-4">
                {leagues.length === 0 ? (
                  <div className="border-t border-white/10 pt-4 text-sm leading-7 text-[var(--muted)]">
                    No leagues yet.
                  </div>
                ) : (
                  leagues.map((league) => (
                    <Link
                      key={league.id}
                      href={`/leagues/${league.id}`}
                      className="block border-t border-white/10 py-4 transition hover:border-white/25"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">
                          {league.name}
                        </h3>
                        <span className="rounded-full border border-white/10 px-3 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                          {league.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
                        <span>{league.memberCount} / {league.maxMembers} members</span>
                        <span>Code: {league.inviteCode}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="mt-8">
            <article className="border-t border-[var(--line)] pt-6">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                League Controls
              </p>
              <div className="mt-5 space-y-3">
                <details className="border-t border-white/10 py-4">
                  <summary className="cursor-pointer list-none font-sans text-2xl uppercase tracking-[0.03em] text-white">
                    Create league
                  </summary>
                  <form action={createLeagueAction} className="mt-4">
                    <label className="block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      League name
                      <input
                        name="name"
                        defaultValue="World Cup Night Crew"
                        className="mt-2 w-full rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>
                    <input type="hidden" name="maxMembers" value="8" />
                    <button className="mt-5 rounded-full bg-[var(--gold)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]">
                      Create league
                    </button>
                  </form>
                </details>

                <details className="border-t border-white/10 py-4">
                  <summary className="cursor-pointer list-none font-sans text-2xl uppercase tracking-[0.03em] text-white">
                    Join with invite
                  </summary>
                  <form action={joinLeagueAction} className="mt-4">
                    <label className="block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Invite code
                      <input
                        name="inviteCode"
                        placeholder="ABC123"
                        className="mt-2 w-full rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm uppercase tracking-[0.16em] text-white outline-none"
                      />
                    </label>
                    <button className="mt-5 rounded-full border border-[var(--line-strong)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white">
                      Join league
                    </button>
                  </form>
                </details>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
