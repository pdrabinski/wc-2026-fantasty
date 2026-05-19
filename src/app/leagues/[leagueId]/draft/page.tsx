import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { startDraftAction, submitDraftPickAction } from "@/app/actions";
import { getLeagueByIdForUser } from "@/lib/db";
import { getFlagEmojiFromCode, seedTeams } from "@/lib/fantasy-data";
import { getCurrentDraftState } from "@/lib/fantasy-engine";

export const dynamic = "force-dynamic";

type DraftPageProps = {
  params: Promise<{
    leagueId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DraftPage({ params, searchParams }: DraftPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const league = await getLeagueByIdForUser(userId, leagueId);

  if (!league) {
    notFound();
  }

  const draft = getCurrentDraftState(league);
  const isCurrentManager = draft.currentManager.userId === league.currentUserId;
  const draftedTeamIds = new Set(
    league.picks.filter((pick) => pick.pickType === "team").map((pick) => pick.targetId),
  );
  const availableTeams = seedTeams.filter((team) => !draftedTeamIds.has(team.id));

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
            Draft Room
          </p>
          <h1 className="mt-3 font-sans text-5xl uppercase tracking-[0.04em] text-white">
            Draft
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/leagues/${league.id}`}
            className="rounded-full border border-[var(--line-strong)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white"
          >
            Back to league
          </Link>
          <form action={startDraftAction}>
            <input type="hidden" name="leagueId" value={league.id} />
            <button className="rounded-full bg-[var(--gold)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]">
              Start or reshuffle
            </button>
          </form>
        </div>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <article className="border-t border-[var(--line)] pt-6 text-white">
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--pitch)]">
              On the Clock
            </p>
            <h2 className="mt-3 font-sans text-4xl uppercase tracking-[0.04em]">
              {draft.currentManager.displayName}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-black/50">Round</p>
                <p className="mt-1 text-3xl">{draft.round}</p>
              </div>
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-black/50">
                  Overall Pick
                </p>
                <p className="mt-1 text-3xl">{draft.pickNumber}</p>
              </div>
            </div>
          </article>

          <article className="border-t border-[var(--line)] pt-6">
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Draft Order
            </p>
            <div className="mt-4 space-y-3">
              {draft.order.map((member, index) => (
                <div
                  key={`${member.userId}-${index}`}
                  className="flex items-center justify-between border-t border-white/10 py-3"
                >
                  <span className="font-sans text-sm uppercase tracking-[0.12em] text-white">
                    {index + 1}. {member.displayName}
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    slot {member.draftPosition || "TBD"}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </aside>

        <div className="grid gap-6">
          <article className="border-t border-[var(--line)] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                  Available Teams
                </p>
                <h2 className="mt-2 font-sans text-3xl uppercase tracking-[0.03em] text-white">Teams</h2>
              </div>
              <span className="rounded-full border border-white/10 px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                5 team draft
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {availableTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-sans text-xl uppercase tracking-[0.03em] text-white">
                        {getFlagEmojiFromCode(team.countryCode)} {team.name}
                      </h3>
                      <span className="rounded-full bg-[var(--pitch)] px-3 py-1 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-white">
                        {team.tier}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {team.countryCode}{team.groupName !== "TBD" ? ` · Group ${team.groupName}` : ""}
                    </p>
                  </div>
                  <form action={submitDraftPickAction}>
                    <input type="hidden" name="leagueId" value={league.id} />
                    <input type="hidden" name="pickType" value="team" />
                    <input type="hidden" name="targetId" value={team.id} />
                    <button
                      disabled={!isCurrentManager}
                      className="rounded-full border border-white/15 px-4 py-2 font-sans text-[0.68rem] uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Draft team
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </article>

          <article className="border-t border-[var(--line)] pt-6">
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Pick History
            </p>
            <div className="mt-4 space-y-3">
              {league.picks.map((pick) => (
                <div
                  key={pick.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-3"
                >
                  <span className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Round {pick.round} · Pick {pick.pickNumber}
                  </span>
                  <span className="text-sm text-white">{pick.label}</span>
                </div>
              ))}
            </div>
          </article>

          {!isCurrentManager ? (
            <p className="text-sm text-[var(--muted)]">
              Waiting on {draft.currentManager.displayName}.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
