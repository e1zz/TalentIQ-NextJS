import { cn } from '@/lib/utils'
import { dataStrokeClass, type DataTone } from '@/components/hr/tones'

export type SparklineProps = {
  data: number[]
  /** brand for neutral trends, success / danger when direction has meaning. */
  tone?: DataTone
  /** Figma KpiCard sparkline is 98 x 40. */
  width?: number
  height?: number
  strokeWidth?: number
  /** When set the chart is exposed as an image with this label;
   * otherwise it is decorative (aria-hidden). */
  label?: string
  className?: string
}

function toPoints(data: number[], width: number, height: number, pad: number) {
  if (data.length === 0) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0
  return data
    .map((value, i) => {
      const x = pad + i * stepX
      // Keep the line inside the middle 70% of the box, like the Figma tiles
      const y = height * 0.15 + (1 - (value - min) / range) * (height * 0.7 - pad)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

/** Minimal SVG line chart. Scales to its data range, draws with
 * currentColor so the tone class controls the stroke. */
export function Sparkline({
  data,
  tone = 'brand',
  width = 98,
  height = 40,
  strokeWidth = 2,
  label,
  className
}: SparklineProps) {
  const pad = strokeWidth
  const points = toPoints(data, width, height, pad)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill='none'
      className={cn('shrink-0', dataStrokeClass[tone], className)}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true, focusable: false })}
    >
      {data.length > 1 ? (
        <polyline
          points={points}
          stroke='currentColor'
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          strokeLinejoin='round'
          vectorEffect='non-scaling-stroke'
        />
      ) : null}
    </svg>
  )
}
