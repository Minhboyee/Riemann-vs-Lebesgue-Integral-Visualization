import React, { useMemo, useState } from 'react';
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
  // HOOKS MUST RUN UNCONDITIONALLY
  const [colorProgress, setColorProgress] = useState<number>(1);
  
  // Use a high number of partitions for the calculation when in "infinite" mode
  const effectivePartitions = isInfinite ? 1000 : partitions;
  const dx = (config.domain[1] - config.domain[0]) / effectivePartitions;

  const { rects, sum } = useMemo(() => {
    // For Dirichlet, we might calculate nonsense here, but we must run the hook.
    // The visualization will be hidden anyway.
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

  // Generate area path for infinite mode
  const areaPoints = useMemo(() => {
      if (!isInfinite) return [];
      return generatePoints(config.fn, config.domain, 200);
  }, [isInfinite, config]);

  // EARLY RETURN FOR DIRICHLET (Moved after hooks)
  if (config.id === FunctionType.DIRICHLET) {
      return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-blue-600">Riemann Integral</h2>
                <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Undefined
                </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="bg-red-50 text-red-700 p-4 rounded-full mb-4 font-bold text-2xl border border-red-100">
                    ?
                </div>
                <h3 className="text-gray-900 font-bold mb-2">Impossible to Visualize</h3>
                <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                    The Dirichlet function is discontinuous everywhere. A Riemann sum cannot be formed because the height <span className="font-mono bg-gray-100 px-1 rounded">f(x*)</span> in any interval <span className="font-mono bg-gray-100 px-1 rounded">Δx</span> fluctuates wildly between 0 and 1.
                </p>
                <div className="mt-8 p-3 bg-gray-50 rounded text-xs text-gray-500 border border-gray-100">
                    Sum Area: <strong>Undefined</strong>
                </div>
            </div>
        </div>
      );
  }

  // STANDARD VISUALIZATION

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

  const footerWithColoring = (
      <div className="flex flex-col gap-3">
         {/* Coloring Slider */}
         <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-600">Coloring</label>
                <span className="text-[10px] text-gray-400">Position (x)</span>
            </div>
            <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={colorProgress}
                onChange={(e) => setColorProgress(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-blue-100 accent-blue-600"
                title="Coloring the area from left to right, column by column."
            />
         </div>
         
         <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-blue-700 font-medium">
            <span>Sum Area:</span>
            <span className="font-mono text-lg">
                {(isInfinite ? '≈ ' : '') + sum.toFixed(4)}
            </span>
         </div>
         <p className="text-gray-500 text-xs">
             {isInfinite 
                ? 'Converged to exact integral (Limit n → ∞)' 
                : `Approximation with ${partitions} vertical slices (dx = ${dx.toFixed(3)})`
             }
         </p>
    </div>
  );

  return (
    <GraphPanel 
      title="Riemann Integral" 
      color="#3b82f6"
      config={config}
      topControls={topControls}
      footer={footerWithColoring}
    >
      {({ xScale, yScale }) => {
        // Prepare area generator
        const areaGenerator = d3Shape.area<Point>()
            .x(p => xScale(p.x))
            .y0(yScale(0))
            .y1(p => yScale(p.y))
            .curve(d3Shape.curveMonotoneX);
        
        // Coloring cutoff X value
        const cutOffX = config.domain[0] + colorProgress * (config.domain[1] - config.domain[0]);
            
        return (
            <g>
            {!isInfinite && rects.map((r, i) => {
                const x = xScale(r.x);
                const w = xScale(r.x + r.width) - x;
                const yZero = yScale(0);
                const yTop = yScale(r.height);
                const h = Math.abs(yZero - yTop);
                // Handle negative values correctly
                const y = r.height >= 0 ? yTop : yZero;
                
                const isColored = r.x <= cutOffX;
                const opacity = isColored ? 0.6 : 0.1;

                return (
                <rect
                    key={i}
                    x={x}
                    y={y}
                    width={Math.max(0, w - 0.5)}
                    height={h}
                    fill="#3b82f6"
                    fillOpacity={opacity}
                    stroke="#2563eb"
                    strokeWidth={isColored ? 1 : 0}
                    strokeOpacity={isColored ? 1 : 0.2}
                    className="transition-all duration-300"
                />
                );
            })}

            {isInfinite && (
                <>
                    {/* Infinite mode masking/clipping for coloring effect */}
                    <defs>
                        <clipPath id="riemann-infinite-colored">
                             <rect x={xScale(config.domain[0])} y={0} width={xScale(cutOffX) - xScale(config.domain[0])} height={1000} />
                        </clipPath>
                    </defs>
                    
                    {/* Faded Background Layer */}
                    <path
                        d={areaGenerator(areaPoints) || ""}
                        fill="#3b82f6"
                        fillOpacity={0.1}
                        stroke="#2563eb"
                        strokeWidth={1}
                        strokeOpacity={0.2}
                    />

                    {/* Colored Layer */}
                    <g clipPath="url(#riemann-infinite-colored)">
                        <path
                            d={areaGenerator(areaPoints) || ""}
                            fill="#3b82f6"
                            fillOpacity={0.6}
                            stroke="#2563eb"
                            strokeWidth={2}
                        />
                    </g>
                </>
            )}
            </g>
        );
      }}
    </GraphPanel>
  );
};