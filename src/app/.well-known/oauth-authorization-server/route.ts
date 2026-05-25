import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

export const dynamic = "force-dynamic";

const handleGet = authServerMetadataHandlerClerk();
const handleOptions = metadataCorsOptionsRequestHandler();

export async function GET() {
  return handleGet();
}

export async function OPTIONS() {
  return handleOptions();
}
