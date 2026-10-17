import { cn } from '@/lib/utils'

export type BarDatum = {
  label: string
  value: number
  /** Value text above the bar. Defaults to the number. */
  displayValue?: string
  /** Draw in brand/600 instead of the muted bar color (Figma: current month). */
  highlight?: boolean
}

export type BarChartProps = {
  data: BarDatum[]
  /** Accessible title, e.g. "Median time to hire by month, in days". */
  label: string
  /** Plot height in px. Figma "ChartBar" track is 160. */
  height?: number
  /** Scale max. Defaults to the largest value. */
  max?: number
  /** Highlight the last bar when no datum sets `highlight`. Defaults to true. */
  highlightLast?: boolean
  /** Header for the value column of the screen-reader table. */
  valueHeader?: string
  className?: string
}

/** Vertical bar chart (Reports, "Time to hire by month"). Bars are drawn
 * with divs; a visually hidden table carries the data for assistive tech. */
export function BarChart({
  data,
  label,
  height = 160,
  max,
  highlightLast = true,
  valueHeader = 'Value',
  className
}: BarChartProps) {
  const scaleMax = max ?? Math.max(1, ...data.map((d) => d.value))
  const anyHighlight = data.some((d) => d.highlight)

  return (
    <figure className={cn('m-0 min-w-0', className)}>
      <figcaption className='sr-only'>{label}</figcaption>
      <div aria-hidden='true' className='flex items-end gap-2.5'>
        {data.map((d, i) => {
          const isHighlight = d.highlight ?? (!anyHighlight && highlightLast && i === data.length - 1)
          const pct = Math.min(100, Math.max(0, (d.value / scaleMax) * 100))
          return (
            <div key={`${d.label}-${i}`} className='flex min-w-0 flex-1 flex-col items-center gap-1.5'>
              <span className='text-meta font-semibold text-fg-secondary tabular-nums'>
                {d.displayValue ?? d.value}
              </span>
              <div className='flex w-full max-w-14 flex-col justify-end' style={{ height }}>
                <div
                  className={cn(
                    'w-full rounded-t-bar rounded-b-[2px]',
                    isHighlight ? 'bg-brand' : 'bg-bar-muted'
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className='truncate text-meta text-muted-foreground'>{d.label}</span>
            </div>
          )
        })}
      </div>
      <table className='sr-only'>
        <thead>
          <tr>
            <th scope='col'>Label</th>
            <th scope='col'>{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={`${d.label}-${i}`}>
              <th scope='row'>{d.label}</th>
              <td>{d.displayValue ?? d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
