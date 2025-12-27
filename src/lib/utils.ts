import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as UGX currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted string like "UGX 1,234,567"
 */
export function formatUGX(
  amount: number | string,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'UGX 0';
  }

  const showSymbol = options?.showSymbol !== false;
  const decimals = options?.decimals ?? 0;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);

  return showSymbol ? `UGX ${formatted}` : formatted;
}