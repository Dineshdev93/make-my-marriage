import { getEditorContext, requireUser } from "@/lib/access";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/origin";
import { validationAppError } from "@/lib/validation";
import { updateTaskSchema } from "@/modules/tasks/schema";
import { deleteTask, updateTask } from "@/modules/tasks/service";

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
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));
    const task = await updateTask(context, id, parsed.data);
    return Response.json({ data: task }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, route: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request);
    const context = await getWeddingEditorContext();
    const { id } = await route.params;
    const result = await deleteTask(context, id);
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
