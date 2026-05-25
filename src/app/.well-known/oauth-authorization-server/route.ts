import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

function deriveClerkFapiUrl(publishableKey: string) {
  const frontendKey = publishableKey.replace(/^pk_(test|live)_/, "");
  return `https://${Buffer.from(frontendKey, "base64").toString("utf8").replace(/\$/, "")}`;
}

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY." },
      { status: 500, headers: corsHeaders },
    );
  }

  const authServerUrl = deriveClerkFapiUrl(publishableKey);
  const response = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`, {
    cache: "no-store",
  });
  const metadata = await response.json();

  return NextResponse.json(metadata, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
