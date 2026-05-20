import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { submitKnockoutPickAction } from "@/app/actions";
import { getBracketMatchesForLeague, getLeagueByIdForUser } from "@/lib/db";
import { getFlagEmojiFromCode } from "@/lib/fantasy-data";

export const dynamic = "force-dynamic";

type BracketPageProps = {
  params: Promise<{
    leagueId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function formatStageLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\bR16\b/i, "Round of 16")
    .replace(/\bR32\b/i, "Round of 32")
    .replace(/\bQF\b/i, "Quarterfinal")
    .replace(/\bSF\b/i, "Semifinal")
    .replace(/\bFINAL\b/i, "Final");
}

export default async function BracketPage({ params, searchParams }: BracketPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const [league, bracketMatches] = await Promise.all([
    getLeagueByIdForUser(userId, leagueId),
    getBracketMatchesForLeague(userId, leagueId),
  ]);

  if (!league) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      {query.error ? (
        <section className="mb-6 border-t border-[var(--danger)] px-1 py-4 text-sm leading-7 text-white">
          {query.error}
        </section>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
        <div>
          <p className="font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[var(--gold)]">
            Knockout Stage
          </p>
          <h1 className="mt-3 font-sans text-5xl uppercase tracking-[0.04em] text-white">
            Bracket
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Group points come from drafted teams. Knockout points come from these bracket picks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/leagues/${league.id}`}
            className="rounded-full border border-[var(--line-strong)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white"
          >
            Back to league
          </Link>
          <Link
            href={`/leagues/${league.id}/admin`}
            className="rounded-full border border-[var(--line-strong)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white"
          >
            Commissioner admin
          </Link>
        </div>
      </div>

      <section className="mt-8 border-t border-[var(--line)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Knockout Picks
            </p>
            <h2 className="mt-2 font-sans text-3xl uppercase tracking-[0.03em] text-white">
              Choose Winners
            </h2>
          </div>
          <span className="rounded-full border border-white/10 px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {bracketMatches.length} fixtures
          </span>
        </div>

        <div className="mt-5 space-y-5">
          {bracketMatches.length === 0 ? (
            <div className="border-t border-white/10 py-4 text-sm leading-7 text-[var(--muted)]">
              No knockout fixtures yet. Once they are synced, everyone in the league can make bracket picks here.
            </div>
          ) : (
            bracketMatches.map((match) => (
              <article key={match.id} className="border-t border-white/10 py-5">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <span className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--gold)]">
                    {formatStageLabel(match.stage)}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] sm:text-center">
                    {new Date(match.kickoffAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "America/Denver",
                    })}
                  </span>
                  <span className="hidden sm:block" aria-hidden="true" />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                  <form action={submitKnockoutPickAction} className="min-w-0">
                    <input type="hidden" name="leagueId" value={league.id} />
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="pickTeamId" value={match.homeTeamId} />
                    <button
                      disabled={match.status === "completed"}
                      className={`w-full border-t px-0 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        match.currentUserPickTeamId === match.homeTeamId
                          ? "border-[var(--gold)] text-white"
                          : "border-white/10 text-white"
                      }`}
                    >
                      <p className="font-sans text-2xl uppercase tracking-[0.03em]">
                        {getFlagEmojiFromCode(match.homeCode)} {match.homeTeam}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {match.homeCode || "HOME"} · {match.homePickedCount} picks
                      </p>
                    </button>
                  </form>

                  <div className="text-center">
                    <p className="font-sans text-3xl uppercase tracking-[0.03em] text-white">
                      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {match.status === "completed" ? "Final" : "Pick winner"}
                    </p>
                    {match.currentUserPickLabel ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                        Your pick: {match.currentUserPickLabel}
                      </p>
                    ) : null}
                  </div>

                  <form action={submitKnockoutPickAction} className="min-w-0">
                    <input type="hidden" name="leagueId" value={league.id} />
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="pickTeamId" value={match.awayTeamId} />
                    <button
                      disabled={match.status === "completed"}
                      className={`w-full border-t px-0 py-3 text-right transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        match.currentUserPickTeamId === match.awayTeamId
                          ? "border-[var(--gold)] text-white"
                          : "border-white/10 text-white"
                      }`}
                    >
                      <p className="font-sans text-2xl uppercase tracking-[0.03em]">
                        {getFlagEmojiFromCode(match.awayCode)} {match.awayTeam}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {match.awayPickedCount} picks · {match.awayCode || "AWAY"}
                      </p>
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
