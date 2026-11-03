import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser, getEditorContext } from "@/lib/access";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect((await getEditorContext(user)) ? "/dashboard" : "/setup");
  return <AuthForm mode="register" />;
}
