"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AppShell({ children }: { children: React.ReactNode }) {
  usePathname();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[linear-gradient(90deg,rgba(9,31,71,0.92),rgba(5,18,43,0.9),rgba(24,63,150,0.9))] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(135deg,var(--green-soft),rgba(255,255,255,0.12),var(--blue-soft),var(--gold-soft))] font-sans text-xs uppercase tracking-[0.2em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
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
              Admin
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
