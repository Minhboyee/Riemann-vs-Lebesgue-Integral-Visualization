import React, { useMemo } from 'react';
import * as d3Shape from 'd3-shape';
import { FunctionConfig, RiemannSumType, FunctionType, Point } from '../types';
import { GraphPanel } from './GraphPanel';
import { generatePoints } from '../utils/math';
import { Infinity as InfinityIcon } from 'lucide-react';

interface RiemannVisualizerProps {
  config: FunctionConfig;
  partitions: number;
  setPartitions: (n: number) => void;
  sumType: RiemannSumType;
  isInfinite: boolean;
  setIsInfinite: (b: boolean) => void;
}

export const RiemannVisualizer: React.FC<RiemannVisualizerProps> = ({ 
    config, 
    partitions, 
    setPartitions, 
    sumType, 
    isInfinite, 
    setIsInfinite 
}) => {
  // Use a high number of partitions for the calculation when in "infinite" mode
  const effectivePartitions = isInfinite ? 1000 : partitions;
  const dx = (config.domain[1] - config.domain[0]) / effectivePartitions;

  const { rects, sum } = useMemo(() => {
    const calculatedRects = [];
    let calculatedSum = 0;
    
    // We loop to calculate sum. If not infinite, we also store rects for rendering.
    for (let i = 0; i < effectivePartitions; i++) {
      const xLeft = config.domain[0] + i * dx;
      const xRight = xLeft + dx;
      
      let xSample = xLeft;
      // When N -> infinity, left/right/midpoint converge to same, but we keep logic consistent
      if (sumType === RiemannSumType.RIGHT) xSample = xRight;
      if (sumType === RiemannSumType.MIDPOINT) xSample = (xLeft + xRight) / 2;
      
      const height = config.fn(xSample);
      calculatedSum += height * dx;

      if (!isInfinite) {
          calculatedRects.push({ x: xLeft, width: dx, height });
      }
    }
    return { rects: calculatedRects, sum: calculatedSum };
  }, [config, effectivePartitions, sumType, dx, isInfinite]);

  const isDirichlet = config.id === FunctionType.DIRICHLET;

  // Generate area path for infinite mode
  const areaPoints = useMemo(() => {
      if (!isInfinite || isDirichlet) return [];
      return generatePoints(config.fn, config.domain, 200);
  }, [isInfinite, isDirichlet, config]);

  const topControls = (
    <div className="flex items-center gap-4 text-xs select-none">
       <span className="text-gray-500 font-medium whitespace-nowrap">n = {isInfinite ? '∞' : partitions}</span>
       <div className="flex-1 flex items-center gap-2">
          <input 
              type="range" 
              min="2" max="100" 
              value={partitions} 
              onChange={(e) => {
                  setPartitions(Number(e.target.value));
                  if (isInfinite) setIsInfinite(false);
              }}
              disabled={isInfinite}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                  isInfinite ? 'bg-gray-100 accent-gray-300' : 'bg-blue-100 accent-blue-600'
              }`}
          />
          <button
              onClick={() => setIsInfinite(!isInfinite)}
              title="Toggle Infinity"
              className={`p-1 rounded border transition-all ${
                  isInfinite 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
          >
              <InfinityIcon size={14} />
          </button>
       </div>
    </div>
  );

  return (
    <GraphPanel 
      title="Riemann Integral" 
      color="#3b82f6"
      config={config}
      topControls={topControls}
      footer={
        <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center text-blue-700 font-medium">
                <span>Sum Area:</span>
                <span className="font-mono text-lg">
                    {isDirichlet 
                        ? 'Undefined' 
                        : (isInfinite ? '≈ ' : '') + sum.toFixed(4)
                    }
                </span>
             </div>
             <p className="text-gray-500 text-xs">
                 {isDirichlet 
                    ? '*Does not converge regardless of partition size.' 
                    : isInfinite 
                        ? 'Converged to exact integral (Limit n → ∞)' 
                        : `Approximation with ${partitions} vertical slices (dx = ${dx.toFixed(3)})`
                 }
             </p>
        </div>
      }
    >
      {({ xScale, yScale }) => {
        // Prepare area generator
        const areaGenerator = d3Shape.area<Point>()
            .x(p => xScale(p.x))
            .y0(yScale(0))
            .y1(p => yScale(p.y))
            .curve(d3Shape.curveMonotoneX);
            
        return (
            <g>
            {!isDirichlet && !isInfinite && rects.map((r, i) => {
                const x = xScale(r.x);
                const w = xScale(r.x + r.width) - x;
                const yZero = yScale(0);
                const yTop = yScale(r.height);
                const h = Math.abs(yZero - yTop);
                // Handle negative values correctly
                const y = r.height >= 0 ? yTop : yZero;

                return (
                <rect
                    key={i}
                    x={x}
                    y={y}
                    width={Math.max(0, w - 0.5)}
                    height={h}
                    fill="#3b82f6"
                    fillOpacity={0.4}
                    stroke="#2563eb"
                    strokeWidth={1}
                    className="transition-all duration-300"
                />
                );
            })}

            {!isDirichlet && isInfinite && (
                <path
                    d={areaGenerator(areaPoints) || ""}
                    fill="#3b82f6"
                    fillOpacity={0.5}
                    stroke="#2563eb"
                    strokeWidth={2}
                />
            )}
            
            {isDirichlet && (
                <g>
                    <rect x={xScale(0)} y={yScale(1)} width={xScale(1)-xScale(0)} height={yScale(0)-yScale(1)} fill="red" fillOpacity={0.1} />
                    <text x={xScale(0.5)} y={yScale(0.5)} textAnchor="middle" fill="#b91c1c" className="text-xs">
                        Cannot determine height Δx
                    </text>
                </g>
            )}
            </g>
        );
      }}
    </GraphPanel>
  );
};
