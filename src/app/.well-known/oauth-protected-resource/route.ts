import { generateClerkProtectedResourceMetadata } from "@clerk/mcp-tools/server";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export const dynamic = "force-dynamic";

function getMcpEndpointUrl(req: NextRequest) {
  return new URL("/api/mcp", req.url).toString();
}

export async function GET(req: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY." },
      { status: 500, headers: corsHeaders },
    );
  }

  const metadata = generateClerkProtectedResourceMetadata({
    publishableKey,
    resourceUrl: getMcpEndpointUrl(req),
    properties: {
      resource_name: "WC Fantasy League MCP",
      scopes_supported: ["openid", "profile", "email"],
      bearer_methods_supported: ["header"],
    },
  });

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
