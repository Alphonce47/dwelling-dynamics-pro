import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ResponsiveTable<T>({
  data, columns, keyExtractor, onRowClick, emptyIcon, emptyTitle, emptyDescription,
}: Props<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
        {emptyIcon}
        <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">{emptyTitle || "No data"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription || ""}</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className={cn("stat-card space-y-2", onRowClick && "cursor-pointer")}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{col.label}</span>
                <span className="text-right text-card-foreground font-medium truncate">{col.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stat-card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.filter(c => !c.hideOnMobile).map((col) => (
              <th key={col.key} className={cn("px-4 py-3 text-left font-medium text-muted-foreground", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.filter(c => !c.hideOnMobile).map((col) => (
                <td key={col.key} className={cn("px-4 py-3", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
