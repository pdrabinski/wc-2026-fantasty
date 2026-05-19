import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { startDraftAction, syncTournamentMatchesAction } from "@/app/actions";
import { getLeagueByIdForUser, getStoredMatches } from "@/lib/db";
import { getFlagEmojiFromCode, seedTeams } from "@/lib/fantasy-data";
import { getTournamentDataSnapshot } from "@/lib/world-cup-data";

export const dynamic = "force-dynamic";

type LeaguePageProps = {
  params: Promise<{
    leagueId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LeaguePage({ params, searchParams }: LeaguePageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const [league, tournament, storedMatches] = await Promise.all([
    getLeagueByIdForUser(userId, leagueId),
    getTournamentDataSnapshot(),
    getStoredMatches(),
  ]);

  if (!league) {
    notFound();
  }

  const canStartDraft = league.currentUserId === league.commissionerUserId;
  const teamCodeById = new Map(seedTeams.map((team) => [team.id, team.countryCode]));

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
            League Hub
          </p>
          <h1 className="mt-3 font-sans text-5xl uppercase tracking-[0.04em] text-white">
            {league.name}
          </h1>
        </section>

        <div className="border-t border-[var(--line)] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="rounded-full bg-[var(--pitch)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white">
              {league.status.replace("_", " ")}
            </span>
            <Link
              href={`/leagues/${league.id}/draft`}
              className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
            >
              Open Draft Room
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Invite code
              </p>
              <p className="mt-2 text-xl text-white">{league.inviteCode}</p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Commissioner
              </p>
              <p className="mt-2 text-xl text-white">{league.commissionerName}</p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Match feed
              </p>
              <p className="mt-2 text-xl text-white">{tournament.provider.label}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="border-t border-[var(--line)] pt-6 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                Standings
              </p>
              <h2 className="mt-2 font-sans text-4xl uppercase tracking-[0.03em] text-white">Table</h2>
            </div>
          </div>

          <div className="mt-5 overflow-hidden border-t border-white/10">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="font-sans uppercase tracking-[0.18em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {league.scores.group.map((score) => {
                  const member = league.members.find((entry) => entry.userId === score.userId);
                  return (
                    <tr key={score.userId} className="border-t border-white/10">
                      <td className="px-4 py-4">{member?.displayName}</td>
                      <td className="px-4 py-4 font-semibold">{score.totalPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="border-t border-[var(--line)] pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                  Matches
                </p>
                <h2 className="mt-2 font-sans text-3xl uppercase tracking-[0.03em] text-white">Feed</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                {tournament.provider.mode === "live" ? "live feed" : "manual fallback"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {tournament.provider.mode === "live" ? "Live tournament feed." : "Fallback feed."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <a className="underline-offset-4 hover:underline" href={tournament.provider.links.footballDataDocs} target="_blank" rel="noreferrer">
                football-data docs
              </a>
              <a className="underline-offset-4 hover:underline" href={tournament.provider.links.fifaSchedule} target="_blank" rel="noreferrer">
                FIFA schedule
              </a>
              <a className="underline-offset-4 hover:underline" href={tournament.provider.links.fifaQualified} target="_blank" rel="noreferrer">
                FIFA qualified teams
              </a>
            </div>
            <div className="mt-5 space-y-3">
              {tournament.matches.slice(0, 6).map((match) => (
                <div
                  key={match.id}
                  className="border-t border-white/10 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--gold)]">
                      {match.stage}{match.groupName ? ` · Group ${match.groupName}` : ""}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {new Date(match.kickoffAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Denver",
                      })}
                    </span>
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
                        {match.status}
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
              ))}
            </div>
          </article>

          <article className="border-t border-[var(--line)] pt-6">
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Rosters
            </p>
            <div className="mt-4 space-y-4">
              {league.members.map((member) => (
                <div key={member.userId} className="border-t border-white/10 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">
                      {member.displayName}
                    </h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Pick slot {member.draftPosition || "TBD"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.roster.length === 0 ? (
                      <span className="text-sm text-[var(--muted)]">No picks.</span>
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

          <article className="border-t border-[var(--line)] pt-6">
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Commissioner Controls
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <form action={startDraftAction}>
                <input type="hidden" name="leagueId" value={league.id} />
                <button
                  disabled={!canStartDraft}
                  className="w-full border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {league.status === "drafting" ? "Re-randomize draft order" : "Start draft"}
                </button>
              </form>
              <form action={syncTournamentMatchesAction}>
                <input type="hidden" name="leagueId" value={league.id} />
                <button
                  disabled={!canStartDraft}
                  className="w-full border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sync tournament fixtures
                </button>
              </form>
              {[
                "Add match result",
                "Recalculate scores",
                "Lock group stage"
              ].map((label) => (
                <button
                  key={label}
                  className="border-t border-white/10 px-0 py-3 text-left font-sans text-xs uppercase tracking-[0.16em] text-white opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
            {!canStartDraft ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Commissioner only.</p>
            ) : null}
          </article>

          <article className="border-t border-[var(--line)] pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                  Stored Fixtures
                </p>
                <h2 className="mt-2 font-sans text-3xl uppercase tracking-[0.03em] text-white">Synced</h2>
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
                storedMatches.slice(0, 6).map((match) => (
                  <div
                    key={match.id}
                    className="border-t border-white/10 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--gold)]">
                        {match.stage}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        {new Date(match.kickoffAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Denver",
                        })}
                      </span>
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
                          {match.status}
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
          </article>
        </div>
      </section>
    </main>
  );
}
