import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  accentColor?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary",
  accentColor = "border-primary",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "overflow-hidden rounded-2xl border border-border border-l-4 bg-card p-5 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-6",
        accentColor,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-tight text-muted-foreground sm:text-sm">
            {title}
          </p>
          <h3 className="mt-2 break-words text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {value}
          </h3>
          {change && (
            <p
              className={cn(
                "mt-2 break-words text-xs font-medium leading-tight sm:text-sm",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-2 sm:h-10 sm:w-10", iconColor)}>
          <Icon className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
        </div>
      </div>
    </motion.div>
  );
}
