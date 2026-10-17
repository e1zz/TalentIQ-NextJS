import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------------------
 * Table building blocks. Match the Figma Employees and Home tables:
 * header cells bg/subtle, 40px, Meta/Strong in text/secondary; body rows
 * with a border/subtle bottom border, Body text, hover bg/subtle and the
 * selected row in info/bg.
 * ------------------------------------------------------------------------- */

export type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string
}

/** Horizontally scrollable wrapper + full-width table. */
export function Table({ className, containerClassName, ...props }: TableProps) {
  return (
    <div className={cn('w-full min-w-0 overflow-x-auto', containerClassName)}>
      <table
        className={cn('w-full border-collapse text-left text-body', className)}
        {...props}
      />
    </div>
  )
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn('sr-only', className)} {...props} />
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />
}

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  selected?: boolean
}

export function TableRow({ selected = false, className, ...props }: TableRowProps) {
  return (
    <tr
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'border-b border-border-subtle transition-colors',
        selected ? 'bg-info-soft' : 'hover:bg-subtle',
        className
      )}
      {...props}
    />
  )
}

export type SortDirection = 'asc' | 'desc'

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  /** Shows the sort affordance (Figma TableHeaderCell "Sortable"). */
  sortable?: boolean
  /** Current direction when this column is the sorted one. */
  sortDirection?: SortDirection | null
  /** Click handler for the sort button. Without it the header is static. */
  onSort?: () => void
  align?: 'left' | 'right' | 'center'
}

export function TableHead({
  sortable = false,
  sortDirection = null,
  onSort,
  align = 'left',
  className,
  children,
  scope = 'col',
  ...props
}: TableHeadProps) {
  const SortIcon =
    sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown

  return (
    <th
      scope={scope}
      aria-sort={
        sortable
          ? sortDirection === 'asc'
            ? 'ascending'
            : sortDirection === 'desc'
              ? 'descending'
              : 'none'
          : undefined
      }
      className={cn(
        'h-10 border-b border-border-subtle bg-subtle px-3 align-middle text-meta font-semibold whitespace-nowrap text-fg-secondary first:pl-4 last:pr-4',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {sortable && onSort ? (
        <button
          type='button'
          onClick={onSort}
          className={cn(
            'hit-target -mx-1 inline-flex items-center gap-1 rounded-sm px-1 hover:text-foreground',
            align === 'right' && 'flex-row-reverse'
          )}
        >
          {children}
          <SortIcon aria-hidden='true' className='size-3.5 text-icon' strokeWidth={1.75} />
        </button>
      ) : (
        <span className='inline-flex items-center gap-1'>
          {children}
          {sortable ? (
            <SortIcon aria-hidden='true' className='size-3.5 text-icon' strokeWidth={1.75} />
          ) : null}
        </span>
      )}
    </th>
  )
}

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right' | 'center'
}

export function TableCell({ align = 'left', className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-3 py-3 align-middle text-body text-fg-body first:pl-4 last:pr-4',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    />
  )
}

export type TableCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  /** Required: e.g. "Select Priya Nair" or "Select all employees". */
  'aria-label': string
}

/** Figma "Checkbox" (4081:1330): 16px, input border, brand fill when checked.
 * Native input with a 44px hit area. */
export const TableCheckbox = React.forwardRef<HTMLInputElement, TableCheckboxProps>(
  ({ className, ...props }, ref) => (
    <span className='hit-target inline-flex size-4 align-middle'>
      <input
        ref={ref}
        type='checkbox'
        className={cn(
          'size-4 cursor-pointer rounded-[4px] border border-input accent-primary',
          className
        )}
        {...props}
      />
    </span>
  )
)
TableCheckbox.displayName = 'TableCheckbox'

/** Two-line cell: primary text + muted secondary (role / title, date / tenure). */
export function TableCellStack({
  primary,
  secondary,
  className
}: {
  primary: React.ReactNode
  secondary?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <span className='truncate text-body font-semibold text-foreground'>{primary}</span>
      {secondary ? (
        <span className='truncate text-meta text-muted-foreground'>{secondary}</span>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * DataTable: column-config wrapper around the blocks above. Stateless:
 * sorting and selection are controlled by the caller, so it renders from
 * server components too (pass onSortChange only from a client component).
 * ------------------------------------------------------------------------- */

export type DataTableColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  /** CSS width for the column, e.g. "120px" or "20%". */
  width?: string
  headerClassName?: string
  className?: string
}

export type DataTableSort = { columnId: string; direction: SortDirection }

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  /** Screen-reader caption, e.g. "Employees". */
  caption: string
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort) => void
  /** Rows drawn with the selected (info/bg) background. */
  selectedRowIds?: readonly string[]
  /** Rendered in a full-width row when `rows` is empty. */
  emptyState?: React.ReactNode
  /** Below the table, e.g. "Showing 1-8 of 160" + Previous / Next. */
  footer?: React.ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  sort,
  onSortChange,
  selectedRowIds,
  emptyState,
  footer,
  className
}: DataTableProps<T>) {
  const selected = new Set(selectedRowIds ?? [])

  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <Table>
        <TableCaption>{caption}</TableCaption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.id} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <TableHeader>
          <tr>
            {columns.map((column) => {
              const isSorted = sort?.columnId === column.id
              return (
                <TableHead
                  key={column.id}
                  align={column.align}
                  sortable={column.sortable}
                  sortDirection={isSorted ? sort?.direction : null}
                  onSort={
                    column.sortable && onSortChange
                      ? () =>
                          onSortChange({
                            columnId: column.id,
                            direction: isSorted && sort?.direction === 'asc' ? 'desc' : 'asc'
                          })
                      : undefined
                  }
                  className={column.headerClassName}
                >
                  {column.header}
                </TableHead>
              )
            })}
          </tr>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className='p-4'>
                {emptyState ?? (
                  <p className='py-6 text-center text-body text-muted-foreground'>
                    No results
                  </p>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row)
              return (
                <TableRow key={id} selected={selected.has(id)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      {footer ? (
        <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-meta text-fg-secondary'>
          {footer}
        </div>
      ) : null}
    </div>
  )
}
