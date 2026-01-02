import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  actions?: boolean;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  actions = true,
}: DataTableProps<T>) {
  const getValue = (row: T, key: string) => {
    const keys = key.split(".");
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-md"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={String(col.key)} className="font-semibold">
                  {col.label}
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => {
              const rowKey = (row as any).id ?? (row as any)._id ?? idx;
              const cells = columns.map((col) => {
                const value = col.render
                  ? col.render(getValue(row, String(col.key)), row)
                  : getValue(row, String(col.key));
                return (
                  <TableCell key={String(col.key)}>
                    {value}
                  </TableCell>
                );
              });

              const status = (row as any).status;
              const rowClass = status === 'Low Stock' ? 'bg-warning/10' : status === 'Out of Stock' ? 'bg-destructive/10' : 'hover:bg-muted/30';
              return (
                <TableRow key={rowKey} className={`${rowClass} transition-colors`}>
                  {cells}
                  {actions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* If row provides its own actions node, render it. Otherwise fall back to icon callbacks. */}
                        {((row as any).actions as React.ReactNode) ? (
                          <div className="flex items-center justify-end">{(row as any).actions}</div>
                        ) : (
                          <>
                            {onView && (
                              <Button variant="ghost" size="icon" onClick={() => onView(row)} className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button variant="ghost" size="icon" onClick={() => onEdit(row)} className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button variant="ghost" size="icon" onClick={() => onDelete(row)} className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
