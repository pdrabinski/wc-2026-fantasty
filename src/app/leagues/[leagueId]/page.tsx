import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

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
  const hasKnockoutFixtures = storedMatches.some((match) => match.stage !== "GROUP");
  const standings = league.members
    .map((member) => {
      const groupScore = league.scores.group.find((score) => score.userId === member.userId);
      const knockoutScore = league.scores.knockout.find((score) => score.userId === member.userId);

      return {
        userId: member.userId,
        displayName: member.displayName,
        totalPoints: (groupScore?.totalPoints ?? 0) + (knockoutScore?.totalPoints ?? 0),
      };
    })
    .sort((left, right) => right.totalPoints - left.totalPoints);
  const overallLeader = standings[0];
  const groupChampion = league.scores.group[0];
  const knockoutChampion = league.scores.knockout[0];

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

  function formatGroupLabel(value?: string | null) {
    if (!value) {
      return "";
    }

    return value.replace(/^GROUP_/i, "Group ");
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
            Match Centre
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
            <div className="flex flex-wrap gap-3">
              {hasKnockoutFixtures ? (
                <Link
                  href={`/leagues/${league.id}/bracket`}
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
                >
                  Bracket
                </Link>
              ) : null}
              {canStartDraft ? (
                <Link
                  href={`/leagues/${league.id}/admin`}
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href={`/leagues/${league.id}/draft`}
                className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
              >
                Draft Room
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Commissioner
              </p>
              <p className="mt-2 text-xl text-white">{league.commissionerName}</p>
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

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="border-t border-white/10 py-3">
              <p className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                Overall Leader
              </p>
              <p className="mt-2 text-lg text-white">
                {overallLeader?.displayName || "TBD"}
              </p>
            </div>
            <div className="border-t border-white/10 py-3">
              <p className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                Group Stage Champion
              </p>
              <p className="mt-2 text-lg text-white">
                {league.members.find((member) => member.userId === groupChampion?.userId)?.displayName || "TBD"}
              </p>
            </div>
            <div className="border-t border-white/10 py-3">
              <p className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                Knockout Champion
              </p>
              <p className="mt-2 text-lg text-white">
                {league.members.find((member) => member.userId === knockoutChampion?.userId)?.displayName || "TBD"}
              </p>
            </div>
          </div>

          {!hasKnockoutFixtures ? (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Bracket picks open once knockout fixtures are synced.
            </p>
          ) : null}

          <div className="mt-5 overflow-hidden border-t border-white/10">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="font-sans uppercase tracking-[0.18em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Bracket</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry) => {
                  const groupScore = league.scores.group.find((score) => score.userId === entry.userId);
                  const knockoutScore = league.scores.knockout.find((score) => score.userId === entry.userId);
                  return (
                    <tr key={entry.userId} className="border-t border-white/10">
                      <td className="px-4 py-4">{entry.displayName}</td>
                      <td className="px-4 py-4">{groupScore?.totalPoints ?? 0}</td>
                      <td className="px-4 py-4">{knockoutScore?.totalPoints ?? 0}</td>
                      <td className="px-4 py-4 font-semibold">{entry.totalPoints}</td>
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
              <h2 className="mt-2 font-sans text-3xl uppercase tracking-[0.03em] text-white">Fixtures</h2>
            </div>
            </div>
            <div className="mt-5 space-y-3">
              {tournament.matches.slice(0, 6).map((match) => (
                <div
                  key={match.id}
                  className="border-t border-white/10 py-4"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <span className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--gold)]">
                      {formatStageLabel(match.stage)}{match.groupName ? ` · ${formatGroupLabel(match.groupName)}` : ""}
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
                        {match.status === "TIMED" ? "Kickoff" : match.status}
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
              Squads
            </p>
            <div className="mt-4 space-y-4">
              {league.members.map((member) => (
                <div key={member.userId} className="border-t border-white/10 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-sans text-2xl uppercase tracking-[0.03em] text-white">
                      {member.displayName}
                    </h3>
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

          {canStartDraft ? (
            <article className="border-t border-[var(--line)] pt-6">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                Commissioner
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-4">
                <p className="text-sm leading-7 text-[var(--muted)]">
                  Run the draft, sync fixtures and results, and oversee the group-stage and knockout races from admin.
                </p>
                <Link
                  href={`/leagues/${league.id}/admin`}
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
                >
                  Open Admin
                </Link>
              </div>
            </article>
          ) : null}

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
                        {formatStageLabel(match.stage)}
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
