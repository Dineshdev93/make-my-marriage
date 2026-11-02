import { errorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/origin";
import { validationAppError } from "@/lib/validation";
import { resetPasswordSchema } from "@/modules/auth/schema";
import { resetPassword } from "@/modules/auth/service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));
    await resetPassword(parsed.data.token, parsed.data.password);
    return Response.json({ data: { message: "Your password has been updated." } });
  } catch (error) {
    return errorResponse(error);
  }
}
