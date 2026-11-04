import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "solid" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  solid: "border border-transparent bg-primary text-background hover:bg-primary-hover",
  outline: "border border-primary bg-transparent text-primary hover:bg-background",
  ghost: "border border-transparent bg-transparent text-foreground hover:bg-background",
};

export function Button({ className = "", variant = "solid", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
