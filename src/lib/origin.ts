import { getEnv } from "./env";
import { AppError } from "./errors";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(getEnv().AUTH_URL).origin) {
    throw new AppError("FORBIDDEN", "This request origin is not allowed.");
  }
}
