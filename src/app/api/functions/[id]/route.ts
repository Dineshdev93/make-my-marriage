import { getEditorContext, requireUser } from "@/lib/access";
import { assertSameOrigin } from "@/lib/origin";
import { AppError, errorResponse } from "@/lib/errors";
import { validationAppError } from "@/lib/validation";
import { updateFunctionSchema } from "@/modules/functions/schema";
import { deleteFunction, updateFunction } from "@/modules/functions/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getWeddingEditorContext() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) throw new AppError("NOT_FOUND", "Wedding not found.");
  return context;
}

export async function PATCH(request: Request, route: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request);
    const context = await getWeddingEditorContext();
    const { id } = await route.params;
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = updateFunctionSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));

    const record = await updateFunction(context, id, parsed.data);
    return Response.json({ data: record }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, route: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request);
    const context = await getWeddingEditorContext();
    const { id } = await route.params;
    const result = await deleteFunction(context, id);
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
