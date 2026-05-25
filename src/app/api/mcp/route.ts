import { verifyClerkToken } from "@clerk/mcp-tools/next";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { syncAppUserIdentity } from "@/lib/db";
import { createWorldCupMcpServer } from "@/lib/mcp-server";

export const dynamic = "force-dynamic";

async function getMcpUserContext() {
  const authState = await auth({ acceptsToken: ["session_token", "oauth_token"] });

  if (!authState.isAuthenticated || !authState.userId) {
    return null;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(authState.userId);
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    user.fullName ||
    user.firstName ||
    user.username ||
    email.split("@")[0] ||
    "Manager";

  const appUser = await syncAppUserIdentity({
    clerkUserId: user.id,
    displayName,
    email,
  });

  if (!appUser) {
    return null;
  }

  return {
    appUser,
    clerkUserId: user.id,
    scopes: "scopes" in authState && Array.isArray(authState.scopes) ? authState.scopes : [],
    tokenType: authState.tokenType ?? null,
  };
}

function getBearerToken(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Unauthorized. Send a valid Clerk session token or OAuth access token.",
      },
      id: null,
    },
    { status: 401 },
  );
}

async function handleMcpRequest(req: NextRequest) {
  const context = await getMcpUserContext();

  if (!context) {
    return unauthorizedResponse();
  }

  const server = createWorldCupMcpServer(context);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const bearerToken = getBearerToken(req);
  const oauthAuthState =
    context.tokenType === "oauth_token" ? await auth({ acceptsToken: "oauth_token" }) : null;
  const authInfo =
    oauthAuthState && bearerToken ? verifyClerkToken(oauthAuthState, bearerToken) : undefined;

  try {
    await server.connect(transport);
    const parsedBody = req.method === "POST" ? await req.json().catch(() => undefined) : undefined;
    return await transport.handleRequest(req, { parsedBody, authInfo });
  } catch (error) {
    console.error("MCP route error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal MCP server error.",
        },
        id: null,
      },
      { status: 500 },
    );
  } finally {
    await server.close().catch(() => undefined);
  }
}

export async function POST(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function GET(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleMcpRequest(req);
}
