import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[17px] font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-ink shadow-card hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-raised",
  ghost: "text-ink-soft hover:bg-bg-deep hover:text-ink",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-3xl border border-line bg-surface p-5 shadow-card", className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-[13px] font-semibold tracking-[0.12em] text-gold uppercase", className)}>{children}</p>;
}

export function Title({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cx("font-serif text-[30px] leading-[1.15] font-medium text-balance text-ink", className)}>
      {children}
    </h1>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[14px] text-ink-faint">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "block w-full min-h-12 rounded-2xl border border-line-strong bg-surface-raised px-4 py-3 text-[17px] text-ink placeholder:text-ink-faint shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)] transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(inputClass, "min-h-28 resize-none leading-relaxed", className)} {...props} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[15px] font-medium text-danger">
      {message}
    </p>
  );
}

/** Centered single-column page for sign-in and onboarding. */
export function CenteredPage({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12 pt-[max(3rem,env(safe-area-inset-top))]">
      {children}
    </main>
  );
}
