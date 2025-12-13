import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export default function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 rounded-xl bg-primary">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <Button onClick={action.onClick} size="lg" className="gap-2">
          {action.icon ? <action.icon className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
