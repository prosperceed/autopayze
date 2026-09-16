"use client";

import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, LoadingRows } from "./empty-state";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Hide this column below the given breakpoint to keep mobile readable. */
  hideBelow?: "sm" | "md" | "lg";
};

type Status = "idle" | "loading" | "error" | "empty";

/**
 * Table shell shared by AdminTable / UserTable / PaymentTable /
 * WalletTable / ActivityTable etc. Each of those is this component
 * plus its own column definitions and data source — the loading,
 * empty, error, search and pagination chrome lives here once.
 */
export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  status = "idle",
  emptyState,
  errorMessage,
  searchPlaceholder,
  onSearchChange,
  pagination,
}: {
  columns: Column<T>[];
  rows: T[];
  status?: Status;
  emptyState: { icon: LucideIcon; title: string; description: string };
  errorMessage?: string;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  pagination?: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
}) {
  return (
    <div className="space-y-3">
      {onSearchChange && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={searchPlaceholder ?? "Search"}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        {status === "loading" ? (
          <div className="p-4">
            <LoadingRows />
          </div>
        ) : status === "error" ? (
          <ErrorState description={errorMessage ?? "Couldn't load this data."} />
        ) : rows.length === 0 ? (
          <EmptyState {...emptyState} />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground",
                        col.hideBelow === "sm" && "hidden sm:table-cell",
                        col.hideBelow === "md" && "hidden md:table-cell",
                        col.hideBelow === "lg" && "hidden lg:table-cell",
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-foreground",
                          col.hideBelow === "sm" && "hidden sm:table-cell",
                          col.hideBelow === "md" && "hidden md:table-cell",
                          col.hideBelow === "lg" && "hidden lg:table-cell",
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
