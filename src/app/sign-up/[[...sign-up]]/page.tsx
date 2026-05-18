import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
      {hasClerkEnv ? (
        <SignUp />
      ) : (
        <div className="max-w-xl rounded-[28px] border border-[var(--line)] bg-white/6 p-8 text-center">
          <h1 className="font-sans text-4xl uppercase tracking-[0.04em] text-white">Configure Clerk</h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Add your Clerk keys to `.env.local` before enabling account creation.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[var(--gold)] px-5 py-3 font-sans text-sm uppercase tracking-[0.18em] text-[var(--ink)]"
          >
            Return Home
          </Link>
        </div>
      )}
    </main>
  );
}
