import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "dark" | "ghost";
  size?: "md" | "sm";
  loading?: boolean;
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 outline-none";
  const sizeStyles = {
    md: "px-[18px] py-[10px] text-[14px] rounded-[var(--radius-md)] leading-[1.3]",
    sm: "px-[12px] py-[8px] text-[14px] rounded-sm leading-[1.3]",
  };
  
  const variantStyles = {
    primary: "bg-[var(--color-primary)] text-[var(--color-on-dark)] hover:bg-[var(--color-primary-pressed)] disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-stone)]",
    secondary: "bg-transparent text-[var(--color-ink)] border border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface-soft)]",
    dark: "bg-[var(--color-ink-deep)] text-[var(--color-on-dark)] hover:bg-[#2A2A2A]",
    ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] rounded-[var(--radius-sm)]",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className} ${loading ? 'opacity-80 pointer-events-none' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  variant = "base",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "base" | "feature" | "yellow-bold" | "surface";
}) {
  const baseStyles = "rounded-[var(--radius-lg)] border border-[var(--color-hairline)]";
  
  const variantStyles = {
    base: "bg-[var(--color-canvas)] p-6",
    feature: "bg-[var(--color-canvas)] p-8",
    "yellow-bold": "bg-[var(--color-card-tint-yellow-bold)] p-8 border-none",
    surface: "bg-[var(--color-surface)] p-6",
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "purple",
  className = ""
}: {
  children: React.ReactNode;
  variant?: "purple" | "pink" | "orange" | "tag-purple" | "tag-green";
  className?: string;
}) {
  const baseStyles = "inline-flex items-center font-semibold rounded-full";
  
  const variantStyles = {
    purple: "bg-[var(--color-primary)] text-[var(--color-on-dark)] px-[10px] py-[4px] text-[13px] leading-[1.4]",
    pink: "bg-[var(--color-brand-pink)] text-[var(--color-on-dark)] px-[10px] py-[4px] text-[13px] leading-[1.4]",
    orange: "bg-[var(--color-brand-orange)] text-[var(--color-on-dark)] px-[10px] py-[4px] text-[13px] leading-[1.4]",
    "tag-purple": "bg-[var(--color-card-tint-lavender)] text-[#6B4B9A] px-[8px] py-[2px] text-[13px] rounded-[var(--radius-sm)]",
    "tag-green": "bg-[var(--color-card-tint-mint)] text-[#1C7345] px-[8px] py-[2px] text-[13px] rounded-[var(--radius-sm)]",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-[44px] w-full bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline-strong)] rounded-[var(--radius-md)] px-[16px] py-[8px] focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all placeholder-[var(--color-muted)] ${className}`}
      {...props}
    />
  );
}
