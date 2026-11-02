import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { assertSameOrigin } from "@/lib/origin";
import { errorResponse } from "@/lib/errors";

export const GET = handlers.GET;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    return await handlers.POST(request);
  } catch (error) {
    return errorResponse(error);
  }
}
