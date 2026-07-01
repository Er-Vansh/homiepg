'use client';

import React, { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  type: 'line' | 'bar';
  color?: string;
  height?: number;
  prefix?: string;
}

export default function AnalyticsChart({ 
  data, 
  type, 
  color = '#6366f1', // default indigo
  height = 200, 
  prefix = '₹' 
}: AnalyticsChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 bg-zinc-50 dark:bg-zinc-900/50" style={{ height }}>
        <span className="text-xs text-zinc-400">No chart telemetry available.</span>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 100);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal;

  const padding = 40;
  const chartHeight = height - padding * 2;
  const chartWidth = 500; // static aspect ratio for SVG viewbox
  const stepX = chartWidth / (data.length - 1 || 1);

  // Compute points for line chart
  const points = data.map((d, idx) => {
    const x = idx * stepX;
    // Calculate Y flipped coordinates (0 is at top in SVG)
    const y = padding + (chartHeight - ((d.value - minVal) / range) * chartHeight);
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Grid lines
  const gridLinesCount = 4;
  const horizontalGrid = Array.from({ length: gridLinesCount }).map((_, idx) => {
    const y = padding + (chartHeight / (gridLinesCount - 1)) * idx;
    const value = maxVal - (range / (gridLinesCount - 1)) * idx;
    return { y, value };
  });

  return (
    <div className="w-full">
      <svg 
        viewBox={`0 0 ${chartWidth} ${height}`} 
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {horizontalGrid.map((grid, idx) => (
          <g key={idx}>
            <line 
              x1="0" 
              y1={grid.y} 
              x2={chartWidth} 
              y2={grid.y} 
              stroke="rgba(161, 161, 170, 0.15)" 
              strokeDasharray="4 4" 
            />
            <text 
              x={-5} 
              y={grid.y + 3} 
              textAnchor="end" 
              className="fill-zinc-400 font-medium text-[9px]"
            >
              {prefix}{Math.round(grid.value).toLocaleString('en-IN')}
            </text>
          </g>
        ))}

        {/* Render Type Line */}
        {type === 'line' && (
          <>
            {/* Area under the line */}
            <path 
              d={`${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`}
              fill="url(#lineGrad)"
            />
            {/* The main stroke path */}
            <path 
              d={pathD} 
              fill="none" 
              stroke={color} 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Data nodes */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredIdx === idx ? 5 : 3} 
                  fill={hoveredIdx === idx ? color : 'var(--background)'}
                  stroke={color} 
                  strokeWidth="2" 
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            ))}
          </>
        )}

        {/* Render Type Bar */}
        {type === 'bar' && (
          <>
            {points.map((p, idx) => {
              const barWidth = Math.max(12, (chartWidth / data.length) * 0.5);
              const barHeight = padding + chartHeight - p.y;
              const barX = p.x - barWidth / 2;
              
              return (
                <rect
                  key={idx}
                  x={barX}
                  y={p.y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="3"
                  fill="url(#barGrad)"
                  opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.6}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </>
        )}

        {/* X Axis Labels */}
        {points.map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={height - 12}
            textAnchor="middle"
            className="fill-zinc-400 font-semibold text-[9px]"
          >
            {p.label}
          </text>
        ))}

        {/* Tooltip Overlay */}
        {hoveredIdx !== null && (
          <g>
            {/* Draw a subtle vertical indicator line */}
            <line 
              x1={points[hoveredIdx].x} 
              y1={padding} 
              x2={points[hoveredIdx].x} 
              y2={padding + chartHeight} 
              stroke="rgba(99, 102, 241, 0.25)" 
              strokeWidth="1"
            />
            {/* Tooltip box */}
            <foreignObject
              x={Math.min(chartWidth - 95, Math.max(5, points[hoveredIdx].x - 45))}
              y={Math.max(5, points[hoveredIdx].y - 35)}
              width="90"
              height="30"
              className="overflow-visible pointer-events-none"
            >
              <div className="bg-zinc-900 border border-zinc-700 text-white rounded px-1.5 py-0.5 text-center shadow-lg animate-fade-in flex flex-col justify-center">
                <span className="text-[7px] text-zinc-400 font-bold leading-none">{points[hoveredIdx].label}</span>
                <span className="text-[9px] font-extrabold leading-tight mt-0.5">
                  {prefix}{points[hoveredIdx].value.toLocaleString('en-IN')}
                </span>
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
}
