import { AuthForm } from "@/components/auth/AuthForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <AuthForm mode="reset-password" token={token} />;
}
