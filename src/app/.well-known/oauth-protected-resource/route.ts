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

function deriveClerkFapiUrl(publishableKey: string) {
  const frontendKey = publishableKey.replace(/^pk_(test|live)_/, "");
  return `https://${Buffer.from(frontendKey, "base64").toString("utf8").replace(/\$/, "")}`;
}

export async function GET(req: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY." },
      { status: 500, headers: corsHeaders },
    );
  }

  const authServerUrl = deriveClerkFapiUrl(publishableKey);
  const metadata = {
    resource: getMcpEndpointUrl(req),
    authorization_servers: [authServerUrl],
    token_types_supported: ["urn:ietf:params:oauth:token-type:access_token"],
    token_introspection_endpoint: `${authServerUrl}/oauth/token`,
    token_introspection_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
    ],
    jwks_uri: `${authServerUrl}/.well-known/jwks.json`,
    authorization_data_types_supported: ["oauth_scope"],
    authorization_data_locations_supported: ["header", "body"],
    key_challenges_supported: [
      {
        challenge_type: "urn:ietf:params:oauth:pkce:code_challenge",
        challenge_algs: ["S256"],
      },
    ],
    resource_name: "WC Fantasy League MCP",
    service_documentation: "https://clerk.com/docs",
    scopes_supported: ["openid", "profile", "email"],
    bearer_methods_supported: ["header"],
  };

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
