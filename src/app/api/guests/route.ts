import { getEditorContext, requireUser } from "@/lib/access";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/origin";
import { validationAppError } from "@/lib/validation";
import { createGuestSchema } from "@/modules/guests/schema";
import { createGuest } from "@/modules/guests/service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const context = await getEditorContext(user);
    if (!context) throw new AppError("NOT_FOUND", "Wedding not found.");
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = createGuestSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));
    const guest = await createGuest(context, parsed.data);
    return Response.json({ data: guest }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
