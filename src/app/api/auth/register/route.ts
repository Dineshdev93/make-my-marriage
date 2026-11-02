import { registerSchema } from "@/modules/auth/schema";
import { registerUser } from "@/modules/auth/service";
import { errorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/origin";
import { validationAppError } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));
    const user = await registerUser(parsed.data);
    return Response.json({ data: user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
