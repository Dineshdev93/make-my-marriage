import { errorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/origin";
import { validationAppError } from "@/lib/validation";
import { forgotPasswordSchema } from "@/modules/auth/schema";
import { requestPasswordReset, RESET_MESSAGE } from "@/modules/auth/service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));
    await requestPasswordReset(parsed.data.email);
    return Response.json({ data: { message: RESET_MESSAGE } });
  } catch (error) {
    return errorResponse(error);
  }
}
