import { getEditorContext, requireUser } from "@/lib/access";
import { assertSameOrigin } from "@/lib/origin";
import { AppError, errorResponse } from "@/lib/errors";
import { validationAppError } from "@/lib/validation";
import { createWeddingSchema, updateWeddingSchema } from "@/modules/wedding/schema";
import { createWedding, updateWedding } from "@/modules/wedding/service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = createWeddingSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));

    const wedding = await createWedding(user.id, parsed.data);
    return Response.json({ data: wedding }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const context = await getEditorContext(user);
    if (!context) throw new AppError("NOT_FOUND", "Wedding not found.");

    const body: unknown = await request.json().catch(() => undefined);
    const parsed = updateWeddingSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));

    const wedding = await updateWedding(context, parsed.data);
    return Response.json({ data: wedding }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
