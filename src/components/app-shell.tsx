"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(7,20,33,0.86)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--gold)] bg-[var(--gold-soft)] font-sans text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
              WCF
            </div>
            <div>
              <p className="font-sans text-[0.66rem] uppercase tracking-[0.28em] text-[var(--gold)]">
                WC Fantasy League
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/dashboard" className="font-sans text-xs uppercase tracking-[0.18em] text-white">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {hasClerkEnv ? (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-[var(--gold)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-[var(--ink)]">
                      Create Account
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-full border border-[var(--line-strong)] px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-white"
              >
                Configure Clerk
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
