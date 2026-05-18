import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

import {
  sampleLeague,
  scoringDefaults,
  seedPlayers,
  seedTeams,
  summarizeLeague,
} from "@/lib/fantasy-data";

const summary = summarizeLeague(sampleLeague);
const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function FeatureCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[28px] border border-[var(--line)] bg-white/5 p-6 backdrop-blur">
      <p className="font-sans text-[0.7rem] uppercase tracking-[0.28em] text-[var(--gold)]">
        Matchday Mode
      </p>
      <h3 className="mt-3 font-sans text-3xl uppercase tracking-[0.04em] text-white">{title}</h3>
      <p className="mt-3 text-base leading-7 text-[var(--muted)]">{body}</p>
    </article>
  );
}

export default function MarketingHome() {
  const featuredTeams = seedTeams.slice(0, 8);
  const featuredPlayers = seedPlayers.slice(0, 6);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.36em] text-[var(--gold)]">
              Private League Football
            </p>
            <h1 className="mt-5 max-w-5xl font-sans text-[4rem] uppercase leading-[0.9] tracking-[0.03em] text-white sm:text-[5.5rem]">
              Draft five nations. Draft six stars. Crown two champions.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-[var(--muted)]">
              Private World Cup fantasy for friend groups.
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
                    Configure Auth
                  </Link>
                </>
              )}
            </div>
          </div>

          <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(247,246,241,0.96),rgba(220,230,225,0.95))] p-6 text-[var(--ink)] shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
              <div>
                <p className="font-sans text-[0.72rem] uppercase tracking-[0.28em] text-[var(--pitch)]">
                  Live Demo League
                </p>
                <h2 className="mt-2 font-sans text-4xl uppercase tracking-[0.03em]">
                  {sampleLeague.name}
                </h2>
              </div>
              <span className="rounded-full bg-[var(--pitch)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white">
                {sampleLeague.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] bg-[var(--ink)] p-4 text-white">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Members
                </p>
                <p className="mt-2 font-sans text-4xl uppercase">{summary.memberCount}</p>
              </div>
              <div className="rounded-[24px] bg-[var(--pitch)] p-4 text-white">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-white/70">
                  Picks Made
                </p>
                <p className="mt-2 font-sans text-4xl uppercase">{summary.pickCount}</p>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-white p-4">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-black/50">
                  Group Leader
                </p>
                <p className="mt-2 font-sans text-3xl uppercase">{summary.groupLeader}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-black/10 bg-white p-5">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-black/50">
                  Scoring Spotlight
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Group win</span>
                    <strong>+{scoringDefaults.team.group.win}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Player goal</span>
                    <strong>+{scoringDefaults.player.goal}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quarterfinal advance</span>
                    <strong>+{scoringDefaults.team.knockout.qf}</strong>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-[var(--panel-muted)] p-5">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-black/50">
                  Draft Build
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>5 national teams</li>
                  <li>6 players</li>
                  <li>1 Tier 1 team max</li>
                  <li>1 Tier 2 team max</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="Balanced Snake Draft"
            body="Random order. Snake rounds. Tier limits."
          />
          <FeatureCard
            title="Two Separate Races"
            body="One winner for groups. One winner for knockouts."
          />
          <FeatureCard
            title="Commissioner Controls"
            body="Enter results. Update stats. Recalculate scores."
          />
        </div>

        <section className="mt-16 grid gap-6 rounded-[32px] border border-[var(--line)] bg-black/15 p-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.3em] text-[var(--gold)]">
              Seed Pools
            </p>
            <h2 className="mt-3 font-sans text-4xl uppercase tracking-[0.04em] text-white">
              Placeholder teams and players to start.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] bg-white/6 p-5">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Featured Teams
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
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
            <div className="rounded-[24px] bg-white/6 p-5">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Featured Players
              </p>
              <div className="mt-4 space-y-3">
                {featuredPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <span>{player.name}</span>
                    <span className="font-sans uppercase tracking-[0.16em] text-[var(--gold)]">
                      {player.position}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
