import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { acceptInviteAction } from "@/app/actions";

type JoinPageProps = {
  params: Promise<{
    inviteCode: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function JoinInvitePage({ params, searchParams }: JoinPageProps) {
  const [{ inviteCode }, query] = await Promise.all([params, searchParams]);
  const { userId } = await auth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-90px)] max-w-4xl items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
      <section className="w-full rounded-[30px] border border-[var(--line)] bg-white/6 p-8 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          League Invite
        </p>
        <h1 className="mt-4 font-sans text-5xl uppercase tracking-[0.04em] text-white">
          Join league {inviteCode}
        </h1>
        {query.error ? (
          <p className="mt-6 rounded-[18px] border border-[var(--danger)] bg-[rgba(207,78,78,0.12)] px-4 py-3 text-sm leading-7 text-white">
            {query.error}
          </p>
        ) : null}
        {userId ? (
          <form action={acceptInviteAction} className="mt-8">
            <input type="hidden" name="inviteCode" value={inviteCode} />
            <button className="rounded-full bg-[var(--gold)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]">
              Accept invite
            </button>
          </form>
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full bg-[var(--gold)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]"
            >
              Sign in to join
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full border border-[var(--line-strong)] px-6 py-3 font-sans text-sm uppercase tracking-[0.18em] text-white"
            >
              Create account
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
