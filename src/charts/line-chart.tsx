// This module owns the @tanstack/charts import (it pulls in d3). The rest of the app imports from here.
import { colorLegend, defineChart, lineY } from '@tanstack/charts'
import { Chart, type ChartPoint } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { tooltip } from '@tanstack/charts/tooltip'

export interface SeriesRow {
  id: string
  series: string
  x: number
  y: number
  /** Shown in the tooltip, e.g. the chip notation. */
  label: string
}

// Slots 1 and 2 of the dataviz reference palette, validated for CVD separation.
const SERIES_COLORS = ['#2a78d6', '#eb6834']

export function SeriesLineChart({
  rows,
  series,
  xLabel,
  yLabel,
  ariaLabel,
  format = (r) => `${r.label} · ${r.y.toFixed(1)}`,
  height = 300,
}: {
  rows: SeriesRow[]
  /** Fixed order so each series keeps its colour. */
  series: string[]
  xLabel: string
  yLabel: string
  ariaLabel: string
  format?: (row: SeriesRow) => string
  height?: number
}) {
  const chart = defineChart({
    marks: [
      lineY(rows, {
        x: (d: SeriesRow) => d.x,
        y: (d: SeriesRow) => d.y,
        z: (d: SeriesRow) => d.series,
        strokeWidth: 2,
      }),
    ],
    scales: {
      x: { scale: scaleLinear, nice: true, axis: { label: xLabel } },
      y: { scale: scaleLinear, nice: true, grid: true, axis: { label: yLabel } },
    },
    // A single series needs no legend box; the section heading names it.
    color:
      series.length > 1
        ? {
            scale: () => scaleOrdinal<string, string>().domain(series).range(SERIES_COLORS),
            legend: colorLegend({ label: 'Series' }),
          }
        : { scale: () => scaleOrdinal<string, string>().domain(series).range(SERIES_COLORS) },
    tooltip: {
      use: tooltip,
      format: (p: ChartPoint<SeriesRow>) => format(p.datum),
    },
  })

  return <Chart definition={chart} height={height} ariaLabel={ariaLabel} />
}
