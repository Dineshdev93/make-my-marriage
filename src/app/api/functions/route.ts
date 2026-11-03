import { getEditorContext, requireUser } from "@/lib/access";
import { assertSameOrigin } from "@/lib/origin";
import { AppError, errorResponse } from "@/lib/errors";
import { validationAppError } from "@/lib/validation";
import { createFunctionSchema } from "@/modules/functions/schema";
import { createFunction } from "@/modules/functions/service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const context = await getEditorContext(user);
    if (!context) throw new AppError("NOT_FOUND", "Wedding not found.");

    const body: unknown = await request.json().catch(() => undefined);
    const parsed = createFunctionSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));

    const record = await createFunction(context, parsed.data);
    return Response.json({ data: record }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
