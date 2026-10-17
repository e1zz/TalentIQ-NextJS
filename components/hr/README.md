# HR primitives

Building blocks for the dashboard screens, taken from the Figma "Components · HR" page. Import them from `@/components/hr`. Every color is a token in `app/globals.css`, so light and dark mode both work without `dark:` classes. You can see each one at `/dashboard/ui-kit`.

## Tones (`tones.ts`)

- `StatusTone`: `success` (on track, approved), `warning` (slow, pending), `danger` (overdue, rejected), `info` (new), `neutral` (done, inactive).
- `AccentTone`: `StatusTone` plus `brand`, `violet` and `teal`, for tags and icon tiles.
- `DataTone`: chart colors. `brand`, `brand-light`, `brand-muted`, `success`, `warning`, `danger`, `neutral`.
- Class maps: `toneSurfaceClass`, `toneDotClass`, `toneIconClass`, `dataFillClass`, `dataStrokeClass`.

## Layout

| Component | Props | Use |
| --- | --- | --- |
| `PageHeader` | `title`, `subtitle?`, `breadcrumb?: { label, href? }[]`, `titleAdornment?`, `actions?` | Title block at the top of every screen |
| `Breadcrumb` | `items: { label, href? }[]` | Used on its own on detail pages |
| `SectionCard` | `title`, `meta?`, `action?: { label, href }`, `headerActions?`, `titleAs?: 'h2' \| 'h3'`, `padding?: 'default' \| 'flush'`, `bodyClassName?` | White card with a header. Use `flush` for tables |
| `EmptyState` | `title`, `description?`, `icon?`, `action?`, `variant?: 'card' \| 'dashed' \| 'plain'`, `size?: 'default' \| 'compact'` | Shown when a list is empty |

## Data display

| Component | Props | Use |
| --- | --- | --- |
| `StatCard` | `label`, `value`, `unit?`, `sublabel?`, `delta?: { label, direction: 'up' \| 'down', sentiment? }`, `sparkline?: { data: number[], tone?, label? }` | KPI card. Maps directly from the Convex `kpi` shape |
| `AttentionCard` | `icon`, `value`, `label`, `sub?`, `tone?: AccentTone`, `action?: { label, href }`, `variant?: 'default' \| 'compact'` | "Needs your attention" tiles |
| `Sparkline` | `data: number[]`, `tone?: DataTone`, `width?`, `height?`, `strokeWidth?`, `label?` | Small SVG trend line |
| `BarChart` | `data: { label, value, displayValue?, highlight? }[]`, `label`, `height?`, `max?`, `highlightLast?`, `valueHeader?` | Vertical bars that also render as an accessible table |
| `ProgressBar` | `value`, `max?`, `tone?: DataTone`, `size?: 'sm' \| 'md' \| 'lg'`, `label?` or `labelledBy?`, `valueText?`, `decorative?` | Meter, e.g. onboarding progress |
| `MeterRow` | `label`, `value`, `max?`, `displayValue?`, `note?`, `tone?`, `size?: 'md' \| 'lg'` | Label + bar + value rows (sources, headcount, funnel) |
| `StatusPill` | `tone?: StatusTone`, `dot?`, `children` | Status labels (On track, Overdue, Approved) |
| `Tag` | `tone?: AccentTone`, `dot?`, `icon?`, `children` | Category labels (source, skill, event type) |
| `CountBadge` | `tone?: 'neutral' \| 'brand' \| 'brand-strong'`, `children` | Counts next to tabs, chips and nav items |
| `InitialsAvatar` | `name`, `size?: 24 \| 28 \| 32 \| 36 \| 40`, `tint?`, `initials?`, `decorative?`, `ring?` | Avatar with initials. The tint is derived from the name |
| `AvatarStack` | `people: { name, tint? }[]`, `max?`, `size?`, `label?` | Overlapping avatars (panels, owners) |

## Tables (`data-table.tsx`)

- **`DataTable<T>`**: `columns: { id, header, cell(row), sortable?, align?, width? }[]`, `rows`, `getRowId`, `caption` (for screen readers), `sort?`, `onSortChange?`, `selectedRowIds?`, `emptyState?`, `footer?`. It handles most lists.
- For custom layouts, use the low-level parts: `Table`, `TableHeader`, `TableBody`, `TableRow` (`selected?`), `TableHead` (`sortable?`, `sortDirection?`, `onSort?`, `align?`), `TableCell` (`align?`), `TableCellStack` (`primary`, `secondary?`) and `TableCheckbox`.

## Controls

| Component | Props | Use |
| --- | --- | --- |
| `HrButton` | `variant?: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size?: 'md' \| 'sm' \| 'icon' \| 'icon-sm'`, `asChild?` | One `primary` per view. Use `asChild` to wrap a `<Link>` |
| `TabsWithCount` / `TabsWithCountContent` | `items: { value, label, count?, disabled? }[]`, `value?` / `defaultValue?`, `onValueChange?`, `label` | Underline tabs with counts (Jobs, Employees, Onboarding) |
| `SegmentedControl<T>` | `options: { value, label, icon? }[]`, `value?` / `defaultValue?`, `onValueChange?`, `label`, `size?: 'sm' \| 'md'` | Board / Table, Day / Week / Month |
| `FilterSelect` | `label`, `options: { value, label }[]`, `allLabel?`, `icon?`, plus native `<select>` props | Filter dropdowns above lists |
| `FilterChip` | `label`, `count?`, `active?`, plus `<button>` props | Toggle chips (Inbox filters) |

## App shell (`components/app-shell`)

- `DashboardShell` wraps every `/dashboard` page. It connects Clerk (`UserButton`, profile) and Convex (`users.ensureUser`, the sidebar badges, ⌘K search via `search.global`).
- Routes are listed in `nav-items.ts`. Screens render inside `<main id="main-content">`, which already has page padding, so start each page with a `PageHeader`.
