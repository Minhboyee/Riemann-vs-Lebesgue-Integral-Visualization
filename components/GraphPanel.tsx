import React, { useMemo } from 'react';
import * as d3 from 'd3-scale';
import * as d3Shape from 'd3-shape';
import { FunctionConfig, Point, FunctionType } from '../types';

interface GraphPanelProps {
  title: string;
  config: FunctionConfig;
  children?: (props: { xScale: d3.ScaleLinear<number, number>; yScale: d3.ScaleLinear<number, number>; width: number; height: number }) => React.ReactNode;
  footer?: React.ReactNode;
  color: string;
  topControls?: React.ReactNode;
}

const MARGIN = { top: 20, right: 30, bottom: 40, left: 50 };

export const GraphPanel: React.FC<GraphPanelProps> = ({ title, config, children, footer, color, topControls }) => {
  const width = 400; // SVG internal coordinate space width
  const height = 300; // SVG internal coordinate space height

  const xScale = useMemo(() => 
    d3.scaleLinear()
      .domain(config.domain)
      .range([MARGIN.left, width - MARGIN.right]),
    [config.domain]
  );

  const yScale = useMemo(() => 
    d3.scaleLinear()
      .domain(config.range)
      .range([height - MARGIN.bottom, MARGIN.top]),
    [config.range]
  );

  // Generate path data for the function
  const lineGenerator = d3Shape.line<Point>()
    .x(p => xScale(p.x))
    .y(p => yScale(p.y))
    .curve(d3Shape.curveMonotoneX);

  const points = useMemo(() => {
     // Generate points for drawing the curve
     const step = (config.domain[1] - config.domain[0]) / 200;
     const pts: Point[] = [];
     for(let x = config.domain[0]; x <= config.domain[1]; x += step) {
         pts.push({ x, y: config.fn(x) });
     }
     return pts;
  }, [config]);

  const pathData = lineGenerator(points) || "";

  // Tick generation
  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className={`text-lg font-bold`} style={{ color }}>{title}</h2>
        <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded">
             {config.id === FunctionType.DIRICHLET ? "Special Case" : "Continuous"}
        </span>
      </div>
      
      {topControls && (
        <div className="bg-white px-4 py-2 border-b border-gray-50">
            {topControls}
        </div>
      )}

      <div className="flex-1 relative p-2 min-h-[300px]">
        <div className="w-full h-full flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-lg max-h-96">
                {/* Grid Lines */}
                {xTicks.map(t => (
                    <line key={`xg-${t}`} x1={xScale(t)} x2={xScale(t)} y1={MARGIN.top} y2={height - MARGIN.bottom} stroke="#f1f5f9" />
                ))}
                {yTicks.map(t => (
                    <line key={`yg-${t}`} x1={MARGIN.left} x2={width - MARGIN.right} y1={yScale(t)} y2={yScale(t)} stroke="#f1f5f9" />
                ))}

                {/* Axes */}
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yScale(0)} y2={yScale(0)} stroke="#94a3b8" strokeWidth={1.5} />
                <line x1={xScale(0)} x2={xScale(0)} y1={MARGIN.top} y2={height - MARGIN.bottom} stroke="#94a3b8" strokeWidth={1.5} />

                {/* Custom Visualization Content */}
                {children && children({ xScale, yScale, width, height })}

                {/* The Function Curve (drawn on top or bottom depending on preference, usually top for visibility) */}
                {config.id !== FunctionType.DIRICHLET && (
                    <path 
                        d={pathData} 
                        fill="none" 
                        stroke="#334155" 
                        strokeWidth={2} 
                        strokeDasharray="4 2"
                        opacity={0.6}
                    />
                )}
                 {config.id === FunctionType.DIRICHLET && (
                    <text x={width/2} y={height/2} textAnchor="middle" fill="#ef4444" fontSize="12">
                        Graph is visually chaotic (Dust)
                    </text>
                 )}

                {/* Axis Labels */}
                {xTicks.map(t => (
                    <text key={`xt-${t}`} x={xScale(t)} y={height - MARGIN.bottom + 15} textAnchor="middle" fontSize="10" fill="#64748b">
                        {t}
                    </text>
                ))}
                {yTicks.map(t => (
                    <text key={`yt-${t}`} x={MARGIN.left - 8} y={yScale(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">
                        {t}
                    </text>
                ))}
            </svg>
        </div>
      </div>

      {footer && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 text-sm">
            {footer}
        </div>
      )}
    </div>
  );
};
