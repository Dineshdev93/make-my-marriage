import { getEditorContext, requireUser } from "@/lib/access";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/origin";
import { validationAppError } from "@/lib/validation";
import { createExpenseSchema } from "@/modules/expenses/schema";
import { createExpense } from "@/modules/expenses/service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const context = await getEditorContext(user);
    if (!context) throw new AppError("NOT_FOUND", "Wedding not found.");
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) return errorResponse(validationAppError(parsed.error));
    const record = await createExpense(context, parsed.data);
    return Response.json({ data: record }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
