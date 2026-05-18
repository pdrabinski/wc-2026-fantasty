import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createLeagueAction, joinLeagueAction } from "@/app/actions";
import { getDashboardLeagues, getPersistenceState, syncCurrentUser } from "@/lib/db";
import { sampleLeague, summarizeLeague } from "@/lib/fantasy-data";

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
  const appUser = await syncCurrentUser();
  const leagues = appUser ? await getDashboardLeagues(userId) : [];
  const summary = summarizeLeague(sampleLeague);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
        <div>
          <p className="font-sans text-[0.72rem] uppercase tracking-[0.3em] text-[var(--gold)]">
            Dashboard
          </p>
          <h1 className="mt-3 font-sans text-5xl uppercase tracking-[0.04em] text-white">
            Your leagues
          </h1>
        </div>
      </div>

      {params.error ? (
        <section className="mt-6 rounded-[22px] border border-[var(--danger)] bg-[rgba(207,78,78,0.12)] px-5 py-4 text-sm leading-7 text-white">
          {params.error}
        </section>
      ) : null}

      {!persistence.available ? (
        <section className="mt-6 rounded-[22px] border border-[var(--gold)] bg-[rgba(211,170,69,0.12)] px-5 py-4 text-sm leading-7 text-white">
          Supabase is not ready yet. Run the SQL in [supabase/schema.sql](/Users/pauldrabinski/Projects/world-cup-fantasy/supabase/schema.sql), then refresh.
          <br />
          <span className="text-[var(--muted)]">{persistence.reason}</span>
        </section>
      ) : null}

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[28px] border border-[var(--line)] bg-white/6 p-6">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            League Controls
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <form action={createLeagueAction} className="rounded-[22px] border border-white/10 bg-black/15 p-4">
              <h2 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">Create league</h2>
              <label className="mt-4 block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                League name
                <input
                  name="name"
                  defaultValue="World Cup Night Crew"
                  className="mt-2 w-full rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="mt-4 block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Max members
                <select
                  name="maxMembers"
                  defaultValue="8"
                  className="mt-2 w-full rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  {[4, 6, 8, 10, 12].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <button className="mt-5 rounded-full bg-[var(--gold)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]">
                Create league
              </button>
            </form>

            <form action={joinLeagueAction} className="rounded-[22px] border border-white/10 bg-black/15 p-4">
              <h2 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">Join with invite</h2>
              <label className="mt-4 block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
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
          </div>
        </article>

        <article className="rounded-[28px] border border-[var(--line)] bg-white/6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                Example League Card
              </p>
              <h2 className="mt-3 font-sans text-4xl uppercase tracking-[0.04em] text-white">
                {sampleLeague.name}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
                A commissioner-run league with seeded teams, players, match cards, and split-phase
                scoring.
              </p>
            </div>
            <span className="rounded-full bg-[var(--pitch)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white">
              {sampleLeague.status.replace("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] bg-black/20 p-4">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Members
              </p>
              <p className="mt-2 font-sans text-4xl uppercase text-white">{summary.memberCount}</p>
            </div>
            <div className="rounded-[22px] bg-black/20 p-4">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Group Leader
              </p>
              <p className="mt-2 font-sans text-4xl uppercase text-white">{summary.groupLeader}</p>
            </div>
            <div className="rounded-[22px] bg-black/20 p-4">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Invite Code
              </p>
              <p className="mt-2 font-sans text-4xl uppercase text-white">{sampleLeague.inviteCode}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--gold)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]">
              UI Preview
            </span>
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            Your Leagues
          </p>
          <div className="mt-4 space-y-4">
            {leagues.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-black/15 p-4 text-sm leading-7 text-[var(--muted)]">
                No leagues yet.
              </div>
            ) : (
              leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="block rounded-[22px] border border-white/10 bg-black/15 p-4 transition hover:border-white/25"
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
                    <span>Invite: {league.inviteCode}</span>
                    <span>Link: {league.inviteLink}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        <aside className="rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            MVP Progress
          </p>
          <div className="mt-4 space-y-4">
            {[
              "Create league and invite friends",
              "Start commissioner-controlled snake draft",
              "Save 5 teams and 6 players per manager",
              "Manually enter results and recalculate points",
              "Lock group stage and reset knockout race",
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                <p className="text-sm leading-7 text-white">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
