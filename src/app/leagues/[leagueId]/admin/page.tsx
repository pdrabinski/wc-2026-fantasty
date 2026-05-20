import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import {
  recalculateLeagueScoresAction,
  startDraftAction,
  syncTournamentMatchesAction,
  syncTournamentResultsAction,
} from "@/app/actions";
import { CopyInviteLink } from "@/components/copy-invite-link";
import { getLeagueByIdForUser, getStoredMatches } from "@/lib/db";
import { getFlagEmojiFromCode, seedTeams } from "@/lib/fantasy-data";

export const dynamic = "force-dynamic";

type LeagueAdminPageProps = {
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
    .replace(/\bGROUP STAGE\b/i, "Group Stage")
    .replace(/\bFINAL\b/i, "Final");
}

export default async function LeagueAdminPage({
  params,
  searchParams,
}: LeagueAdminPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const [league, storedMatches] = await Promise.all([
    getLeagueByIdForUser(userId, leagueId),
    getStoredMatches(),
  ]);

  if (!league) {
    notFound();
  }

  const isCommissioner = league.currentUserId === league.commissionerUserId;
  const teamCodeById = new Map(seedTeams.map((team) => [team.id, team.countryCode]));

  if (!isCommissioner) {
    redirect(`/leagues/${league.id}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      {query.error ? (
        <section className="mb-6 border-t border-[var(--danger)] px-1 py-4 text-sm leading-7 text-white">
          {query.error}
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[var(--gold)]">
            Commissioner Admin
          </p>
          <h1 className="mt-3 font-sans text-5xl uppercase tracking-[0.04em] text-white">
            {league.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Run the draft, sync fixtures, and manage matchday from one place.
          </p>
        </section>

        <div className="border-t border-[var(--line)] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="rounded-full bg-[var(--pitch)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white">
              {league.status.replace("_", " ")}
            </span>
            <Link
              href={`/leagues/${league.id}`}
              className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
            >
              Back to League
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Invite link
              </p>
              <CopyInviteLink href={`https://wc-2026-fantasty.vercel.app${league.inviteLink}`} />
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Managers
              </p>
              <p className="mt-2 text-xl text-white">
                {league.members.length} / {league.maxMembers}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Commissioner
              </p>
              <p className="mt-2 text-xl text-white">{league.commissionerName}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="border-t border-[var(--line)] pt-6">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            Matchday Controls
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <form action={startDraftAction}>
              <input type="hidden" name="leagueId" value={league.id} />
              <button className="w-full border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white">
                {league.status === "drafting" ? "Re-draw order" : "Start draft"}
              </button>
            </form>
            <form action={syncTournamentMatchesAction}>
              <input type="hidden" name="leagueId" value={league.id} />
              <button className="w-full border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white">
                Sync fixtures
              </button>
            </form>
            <form action={syncTournamentResultsAction}>
              <input type="hidden" name="leagueId" value={league.id} />
              <button className="w-full border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white">
                Sync results
              </button>
            </form>
            <form action={recalculateLeagueScoresAction}>
              <input type="hidden" name="leagueId" value={league.id} />
              <button className="w-full border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white">
                Recalculate table
              </button>
            </form>
            <button className="border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white opacity-60">
              Lock group stage
            </button>
          </div>
        </article>

        <article className="border-t border-[var(--line)] pt-6">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            Managers
          </p>
          <div className="mt-4 space-y-4">
            {league.members.map((member) => (
              <div key={member.userId} className="border-t border-white/10 py-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">
                    {member.displayName}
                  </h2>
                  <span className="rounded-full border border-white/10 px-3 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Draft spot {member.draftPosition || "TBD"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.roster.length === 0 ? (
                    <span className="text-sm text-[var(--muted)]">No teams drafted.</span>
                  ) : (
                    member.roster.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-white/8 px-3 py-2 font-sans text-[0.7rem] uppercase tracking-[0.16em] text-white"
                        >
                        {getFlagEmojiFromCode(teamCodeById.get(item.sourceId))} {item.label}
                        </span>
                      ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-8 border-t border-[var(--line)] pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Synced Fixtures
            </p>
            <h2 className="mt-2 font-sans text-3xl uppercase tracking-[0.03em] text-white">
              Control Room
            </h2>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
            {storedMatches.length} synced
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {storedMatches.length === 0 ? (
            <div className="border-t border-white/10 py-4 text-sm leading-7 text-[var(--muted)]">
              No synced fixtures yet.
            </div>
          ) : (
            storedMatches.slice(0, 8).map((match) => (
              <div key={match.id} className="border-t border-white/10 py-4">
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
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-sans text-xl uppercase tracking-[0.03em] text-white">
                      {getFlagEmojiFromCode(match.homeCode)} {match.homeTeam}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{match.homeCode || "HOME"}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-sans text-3xl uppercase tracking-[0.03em] text-white">
                      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {match.status === "completed" ? "Final" : "Scheduled"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-xl uppercase tracking-[0.03em] text-white">
                      {getFlagEmojiFromCode(match.awayCode)} {match.awayTeam}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{match.awayCode || "AWAY"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
