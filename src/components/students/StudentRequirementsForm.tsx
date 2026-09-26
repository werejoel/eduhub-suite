import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { StudentRequirement } from "@/lib/types";
import {
  STORE_ITEM_CATALOG,
  getRequirementRemaining,
  getRequirementsProgress,
} from "@/lib/schoolConfig";

interface Props {
  requirements: StudentRequirement[];
  onChange: (next: StudentRequirement[]) => void;
  readOnly?: boolean;
}

export default function StudentRequirementsForm({
  requirements,
  onChange,
  readOnly = false,
}: Props) {
  const progress = getRequirementsProgress(requirements);

  const updateRow = (id: string, patch: Partial<StudentRequirement>) => {
    onChange(
      requirements.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        const required = next.requiredQuantity ?? 0;
        const brought = next.broughtQuantity ?? 0;
        if (required > 0) {
          next.completed = brought >= required;
          next.completedDate =
            next.completed && !r.completed
              ? new Date().toISOString()
              : next.completed
                ? next.completedDate
                : undefined;
        }
        return next;
      }),
    );
  };

  const addFromCatalog = (catalogKey: string) => {
    const item = STORE_ITEM_CATALOG.find((c) => c.key === catalogKey);
    if (!item) return;
    const id = `custom-${catalogKey}-${Date.now()}`;
    onChange([
      ...requirements,
      {
        id,
        catalogKey: item.key,
        name: item.label,
        unit: item.unit,
        requiredQuantity: item.defaultRequired,
        broughtQuantity: 0,
        completed: false,
      },
    ]);
  };

  const addCustomRow = () => {
    onChange([
      ...requirements,
      {
        id: `custom-${Date.now()}`,
        name: "",
        requiredQuantity: 1,
        broughtQuantity: 0,
        unit: "pcs",
        completed: false,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Select onValueChange={addFromCatalog}>
            <SelectTrigger className="sm:max-w-xs">
              <SelectValue placeholder="Add item from list…" />
            </SelectTrigger>
            <SelectContent>
              {STORE_ITEM_CATALOG.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label} ({item.defaultRequired} {item.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={addCustomRow}>
            <Plus className="w-4 h-4 mr-2" />
            Custom item
          </Button>
        </div>
      )}

      <div className="space-y-3 max-h-[420px] overflow-y-auto">
        {requirements.map((req, index) => {
          const remaining = getRequirementRemaining(req);
          return (
            <div
              key={req.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg border bg-muted/30 items-end"
            >
              <div className="sm:col-span-1 text-xs text-muted-foreground font-mono">
                #{index + 1}
              </div>
              <div className="sm:col-span-3 space-y-1">
                <Label className="text-xs">Item</Label>
                <Input
                  value={req.name}
                  disabled={readOnly}
                  onChange={(e) => updateRow(req.id, { name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Required</Label>
                <Input
                  type="number"
                  min={0}
                  disabled={readOnly}
                  value={req.requiredQuantity ?? ""}
                  onChange={(e) =>
                    updateRow(req.id, {
                      requiredQuantity: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Brought</Label>
                <Input
                  type="number"
                  min={0}
                  disabled={readOnly}
                  value={req.broughtQuantity ?? ""}
                  onChange={(e) =>
                    updateRow(req.id, {
                      broughtQuantity: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Unit</Label>
                <Input
                  value={req.unit ?? ""}
                  disabled={readOnly}
                  onChange={(e) => updateRow(req.id, { unit: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 text-sm">
                <span
                  className={
                    remaining === 0
                      ? "text-green-600 font-medium"
                      : "text-amber-700 font-medium"
                  }
                >
                  Balance: {remaining} {req.unit || ""}
                </span>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="sm:col-span-12 sm:justify-self-end text-destructive"
                  onClick={() =>
                    onChange(requirements.filter((r) => r.id !== req.id))
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-primary/10 p-3 rounded-lg text-sm space-y-1">
        <p className="font-medium text-primary">
          Progress: {progress.label} · {progress.completedCount} of{" "}
          {progress.totalCount} items complete
        </p>
        {progress.remainingTotal > 0 && (
          <p className="text-muted-foreground">
            Remaining to bring: {progress.remainingTotal} units total
          </p>
        )}
      </div>
    </div>
  );
}
