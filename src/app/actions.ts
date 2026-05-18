"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createLeagueForUser,
  syncTournamentMatchesForLeague,
  joinLeagueForUser,
  startDraftForLeague,
  submitDraftPickForLeague,
  syncCurrentUser,
} from "@/lib/db";

function buildErrorRedirect(path: string, message: string) {
  const params = new URLSearchParams({ error: message });
  return `${path}?${params.toString()}`;
}

export async function createLeagueAction(formData: FormData) {
  const user = await syncCurrentUser();
  if (!user) {
    redirect(buildErrorRedirect("/dashboard", "Sign in before creating a league."));
  }

  const name = String(formData.get("name") || "").trim();
  const maxMembers = Number(formData.get("maxMembers") || 8);

  if (!name) {
    redirect(buildErrorRedirect("/dashboard", "League name is required."));
  }

  try {
    const leagueId = await createLeagueForUser(user, { name, maxMembers });
    revalidatePath("/dashboard");
    redirect(`/leagues/${leagueId}`);
  } catch (error) {
    redirect(
      buildErrorRedirect(
        "/dashboard",
        error instanceof Error ? error.message : "Unable to create league.",
      ),
    );
  }
}

export async function joinLeagueAction(formData: FormData) {
  const user = await syncCurrentUser();
  if (!user) {
    redirect(buildErrorRedirect("/dashboard", "Sign in before joining a league."));
  }

  const inviteCode = String(formData.get("inviteCode") || "").trim();
  if (!inviteCode) {
    redirect(buildErrorRedirect("/dashboard", "Invite code is required."));
  }

  try {
    const leagueId = await joinLeagueForUser(user, inviteCode);
    revalidatePath("/dashboard");
    redirect(`/leagues/${leagueId}`);
  } catch (error) {
    redirect(
      buildErrorRedirect(
        "/dashboard",
        error instanceof Error ? error.message : "Unable to join league.",
      ),
    );
  }
}

export async function acceptInviteAction(formData: FormData) {
  const user = await syncCurrentUser();
  const inviteCode = String(formData.get("inviteCode") || "").trim();

  if (!user) {
    redirect(buildErrorRedirect(`/join/${inviteCode}`, "Sign in before joining a league."));
  }

  try {
    const leagueId = await joinLeagueForUser(user, inviteCode);
    revalidatePath("/dashboard");
    redirect(`/leagues/${leagueId}`);
  } catch (error) {
    redirect(
      buildErrorRedirect(
        `/join/${inviteCode}`,
        error instanceof Error ? error.message : "Unable to join league.",
      ),
    );
  }
}

export async function startDraftAction(formData: FormData) {
  const user = await syncCurrentUser();
  if (!user) {
    redirect(buildErrorRedirect("/dashboard", "Sign in before starting a draft."));
  }

  const leagueId = String(formData.get("leagueId") || "");
  try {
    await startDraftForLeague(user, leagueId);
    revalidatePath(`/leagues/${leagueId}`);
    revalidatePath(`/leagues/${leagueId}/draft`);
    redirect(`/leagues/${leagueId}/draft`);
  } catch (error) {
    redirect(
      buildErrorRedirect(
        `/leagues/${leagueId}`,
        error instanceof Error ? error.message : "Unable to start draft.",
      ),
    );
  }
}

export async function submitDraftPickAction(formData: FormData) {
  const user = await syncCurrentUser();
  if (!user) {
    redirect(buildErrorRedirect("/dashboard", "Sign in before drafting."));
  }

  const leagueId = String(formData.get("leagueId") || "");
  const pickType = String(formData.get("pickType") || "") as "team" | "player";
  const targetId = String(formData.get("targetId") || "");

  try {
    await submitDraftPickForLeague(user, leagueId, { pickType, targetId });
    revalidatePath(`/leagues/${leagueId}`);
    revalidatePath(`/leagues/${leagueId}/draft`);
    redirect(`/leagues/${leagueId}/draft`);
  } catch (error) {
    redirect(
      buildErrorRedirect(
        `/leagues/${leagueId}/draft`,
        error instanceof Error ? error.message : "Unable to save draft pick.",
      ),
    );
  }
}

export async function syncTournamentMatchesAction(formData: FormData) {
  const user = await syncCurrentUser();
  if (!user) {
    redirect(buildErrorRedirect("/dashboard", "Sign in before syncing fixtures."));
  }

  const leagueId = String(formData.get("leagueId") || "");

  try {
    await syncTournamentMatchesForLeague(user, leagueId);
    revalidatePath(`/leagues/${leagueId}`);
    redirect(`/leagues/${leagueId}`);
  } catch (error) {
    redirect(
      buildErrorRedirect(
        `/leagues/${leagueId}`,
        error instanceof Error ? error.message : "Unable to sync tournament fixtures.",
      ),
    );
  }
}
