import React, { useMemo, useState, useEffect } from 'react';
import * as d3 from 'd3-scale';
import * as d3Shape from 'd3-shape';
import { Layers, BoxSelect, BookOpen, Grid3X3, Waves, Infinity as InfinityIcon } from 'lucide-react';
import { FunctionConfig, FunctionType, Point } from '../types';
import { getLebesgueSlices, calculateMeasure, getMeasureCurve, getLayerCakeSlices, getSliceGeometry, integrateMeasureCurve } from '../utils/math';

interface LebesgueVisualizerProps {
  config: FunctionConfig;
  levels: number;
  setLevels: (n: number) => void;
  isInfinite: boolean;
  setIsInfinite: (b: boolean) => void;
}

type ViewMode = 'measure' | 'area' | 'theory';

export const LebesgueVisualizer: React.FC<LebesgueVisualizerProps> = ({ 
    config, 
    levels, 
    setLevels,
    isInfinite = false,
    setIsInfinite
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('area');
  const [probeT, setProbeT] = useState<number | null>(null);
  const [isCoarseMode, setIsCoarseMode] = useState<boolean>(false);

  // HOOKS MUST RUN UNCONDITIONALLY

  // Automatically switch to Theory mode if Dirichlet is selected
  useEffect(() => {
    if (config.id === FunctionType.DIRICHLET) {
        setViewMode('theory');
    } else if (viewMode === 'theory') {
        // Switch back to default view if moving away from Dirichlet
        setViewMode('area');
    }
  }, [config.id]);

  // Use config range for consistent coordinates
  const yMin = config.range[0];
  const yMax = config.range[1];
  
  // For Area mode, region A = {0 <= t <= f(x)}, implying t starts at 0.
  const areaYMin = Math.max(0, yMin);
  const areaRange: [number, number] = [areaYMin, yMax];

  // 1. Calculate Slices
  const measureSlices = useMemo(() => {
      if (config.id === FunctionType.DIRICHLET || isInfinite) return [];
      return getLebesgueSlices(config.fn, config.domain, [yMin, yMax], levels);
  }, [config, levels, yMin, yMax, isInfinite]);

  const areaSlices = useMemo(() => {
      if (config.id === FunctionType.DIRICHLET || isInfinite) return [];
      // Pre-calculate all slices for Coarse mode
      return getLayerCakeSlices(config.fn, config.domain, areaRange, levels);
  }, [config, levels, areaRange, isInfinite]);

  // 2. Calculate Measure Curve
  const measureCurvePoints = useMemo(() => {
     if (config.id === FunctionType.DIRICHLET) return [];
     return getMeasureCurve(config.fn, config.domain, [yMin, yMax], 100);
  }, [config, yMin, yMax]);

  const totalSum = useMemo(() => {
      if (config.id === FunctionType.DIRICHLET) return 0;
      if (isInfinite) {
          return integrateMeasureCurve(config.fn, config.domain, [yMin, yMax]);
      }
      return measureSlices.reduce((acc, slice) => acc + (slice.yBase * slice.measure), 0);
  }, [measureSlices, config, isInfinite, yMin, yMax]);

  // The total potential area sum (full integration)
  const maxAreaSum = useMemo(() => {
      if (config.id === FunctionType.DIRICHLET) return 0;
      return integrateMeasureCurve(config.fn, config.domain, areaRange);
  }, [config, areaRange]);

  // Handle default probeT
  const currentT = probeT === null ? (yMax + yMin) / 2 : probeT;
  
  // Calculate Real-Time Accumulated Area
  const accumulatedArea = useMemo(() => {
      if (config.id === FunctionType.DIRICHLET) return 0;
      // Integrate from bottom (0) to current slider position (currentT)
      const tEnd = Math.max(areaYMin, currentT);
      return integrateMeasureCurve(config.fn, config.domain, [areaYMin, tEnd]);
  }, [config, areaYMin, currentT]);
  
  // Progress percentage
  const progressPercent = Math.min(100, Math.max(0, ((currentT - areaYMin) / (yMax - areaYMin)) * 100));

  const currentMeasure = useMemo(() => {
      if (config.id === FunctionType.DIRICHLET) return 0;
      return calculateMeasure(config.fn, config.domain, currentT);
  }, [config, currentT]);

  // Calculate Single Active Slice for Dynamic (Fine) Mode
  const dt = isInfinite ? 0 : (yMax - areaYMin) / levels;
  const dynamicActiveSlice = useMemo(() => {
      if (viewMode !== 'area' || isCoarseMode || config.id === FunctionType.DIRICHLET || isInfinite) return null;
      return getSliceGeometry(config.fn, config.domain, currentT, dt);
  }, [config, currentT, dt, viewMode, isCoarseMode, isInfinite]);

  const funcPoints = useMemo(() => {
      const step = (config.domain[1] - config.domain[0]) / 200;
      const pts: Point[] = [];
      for(let x = config.domain[0]; x <= config.domain[1]; x += step) pts.push({ x, y: config.fn(x) });
      return pts;
  }, [config]);

  // EARLY RETURN FOR DIRICHLET (Moved after hooks)
  if (config.id === FunctionType.DIRICHLET) {
    return (
        <div className="flex flex-col bg-white rounded-xl shadow-lg border border-amber-200 overflow-hidden h-full">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-amber-900">Lebesgue Integration</h2>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                        Theory-only
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white text-slate-800">
                {/* Global Message */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-lg shadow-sm">
                    <p className="text-slate-700 font-medium italic text-center">
                        “This example is integrated by <strong>measure logic</strong>, not geometry.”
                    </p>
                </div>

                {/* 1. Function Definition */}
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">1. Function Definition</h3>
                    <div className="font-mono text-sm bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
                        <div className="flex items-center gap-4">
                            <span>f(x) =</span>
                            <div className="flex flex-col border-l-2 border-slate-400 pl-3 gap-1">
                                <span>1   <span className="text-slate-500 text-xs ml-2">if x ∈ ℚ</span></span>
                                <span>0   <span className="text-slate-500 text-xs ml-2">if x ∉ ℚ</span></span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">Domain: [0, 1]</div>
                    </div>
                </section>

                {/* 2. Level Set Analysis */}
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">2. Level Set Analysis</h3>
                    <p className="text-sm text-slate-600 mb-4">We analyze the super-level sets <span className="font-mono bg-slate-100 px-1 rounded text-xs">E_t = {'{'} x | f(x) {'>'} t {'}'}</span>:</p>
                    
                    <div className="space-y-4 pl-2">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></div>
                            <div>
                                <div className="font-mono text-sm text-indigo-900 font-bold mb-1">For 0 ≤ t &lt; 1:</div>
                                <div className="font-mono text-sm text-slate-700 bg-indigo-50 px-3 py-1.5 rounded inline-block">
                                    E_t = ℚ ∩ [0,1]
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"></div>
                            <div>
                                <div className="font-mono text-sm text-slate-500 font-bold mb-1">For t ≥ 1:</div>
                                <div className="font-mono text-sm text-slate-400 bg-slate-50 px-3 py-1.5 rounded inline-block">
                                    E_t = ∅
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Measure Computation */}
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">3. Measure Computation</h3>
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 text-sm space-y-4 text-center">
                        <p className="text-blue-900 leading-relaxed">
                           <strong>ℚ is countable.</strong><br/>
                           All countable sets have Lebesgue measure zero.
                        </p>
                        <div className="font-mono text-lg font-bold text-blue-700 bg-white/50 py-2 rounded">
                           μ(E_t) = 0
                        </div>
                        <p className="text-xs uppercase tracking-wide text-blue-500 font-bold">
                           For all relevant t
                        </p>
                    </div>
                     <div className="mt-2 text-center text-xs text-slate-400 italic">
                        “Every value level occupies zero space.”
                    </div>
                </section>

                {/* 4. Integral Conclusion */}
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">4. Integral Conclusion</h3>
                    <div className="bg-fuchsia-50 p-6 rounded-lg border border-fuchsia-100 text-center shadow-sm">
                        <div className="font-mono text-sm inline-block text-left space-y-2">
                            <div className="flex gap-3">
                                <span className="w-12 text-right text-slate-500">∫ f dμ</span>
                                <span>= ∫₀^∞ μ(E_t) dt</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="w-12"></span>
                                <span>= ∫₀¹ 0 dt</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="w-12"></span>
                                <span className="font-bold text-xl text-fuchsia-600">= 0</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-center">
                 <p className="text-xs text-slate-500 italic">
                    “This example shows why Lebesgue integration is not based on area approximation.”
                 </p>
            </div>
        </div>
    );
  }

  // STANDARD VISUALIZATION MODE

  // Visualization Dimensions
  const height = 180; 
  const width = 400;
  const margin = { top: 15, right: 30, bottom: 30, left: 40 };
  
  // Single panel height is taller
  const singlePanelHeight = 300; 

  // SCALES
  const xScaleFunc = d3.scaleLinear().domain(config.domain).range([margin.left, width - margin.right]);
  const yScaleFunc = d3.scaleLinear().domain([yMin, yMax]).range([height - margin.bottom, margin.top]);
  
  const yScaleArea = d3.scaleLinear().domain([yMin, yMax]).range([singlePanelHeight - margin.bottom, margin.top]);

  const xScaleMeasure = d3.scaleLinear().domain([yMin, yMax]).range([margin.left, width - margin.right]);
  const maxMeasure = config.domain[1] - config.domain[0];
  const yScaleMeasure = d3.scaleLinear().domain([0, maxMeasure]).range([height - margin.bottom, margin.top]);

  // Generators
  const lineGeneratorFunc = d3Shape.line<Point>().x(p => xScaleFunc(p.x)).y(p => yScaleFunc(p.y)).curve(d3Shape.curveMonotoneX);
  const lineGeneratorArea = d3Shape.line<Point>().x(p => xScaleFunc(p.x)).y(p => yScaleArea(p.y)).curve(d3Shape.curveMonotoneX);
  
  const areaGeneratorMeasure = d3Shape.area<Point>().x(p => xScaleMeasure(p.x)).y0(yScaleMeasure(0)).y1(p => yScaleMeasure(p.y)).curve(d3Shape.curveStepAfter);
  
  // Area generator for accumulated area (Dynamic mode)
  const areaGeneratorAccumulated = d3Shape.area<Point>()
    .x(p => xScaleFunc(p.x))
    .y0(yScaleArea(0))
    .y1(p => yScaleArea(p.y))
    .curve(d3Shape.curveMonotoneX);

  const isDirichlet = config.id === FunctionType.DIRICHLET;

  // Ticks
  const xTicksFunc = xScaleFunc.ticks(5);
  const yTicksFunc = yScaleFunc.ticks(5);
  const yTicksArea = yScaleArea.ticks(5);
  const xTicksMeasure = xScaleMeasure.ticks(5);
  const yTicksMeasure = yScaleMeasure.ticks(3);

  // COLORS
  const colorActiveFill = "#d946ef"; // Strong Neon Purple
  const colorActiveStroke = "#a21caf";
  const colorAccumulatedFill = "#e879f9"; // Lighter Pastel Purple
  const colorAccumulatedOpacity = 0.25;
  const colorShadowLayer = "#94a3b8"; // Slate 400
  const opacityShadowLayer = 0.15;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-full">
      <div className="bg-fuchsia-50 px-4 py-3 border-b border-fuchsia-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-fuchsia-700">Lebesgue Integration</h2>
             <div className="flex bg-white rounded-lg border border-fuchsia-200 p-0.5">
                <button 
                    onClick={() => setViewMode('measure')}
                    className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${viewMode === 'measure' ? 'bg-fuchsia-100 text-fuchsia-700' : 'text-gray-500 hover:text-fuchsia-600'}`}
                >
                    <Layers size={14}/> Measure
                </button>
                <button 
                    onClick={() => setViewMode('area')}
                    className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${viewMode === 'area' ? 'bg-fuchsia-100 text-fuchsia-700' : 'text-gray-500 hover:text-fuchsia-600'}`}
                >
                    <BoxSelect size={14}/> Slicing
                </button>
             </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-xs font-mono text-fuchsia-600 bg-fuchsia-100 px-2 py-1 rounded">
                Accumulated ≈ {accumulatedArea.toFixed(4)}
            </span>
            {viewMode === 'area' && (
                <span className="text-[9px] text-fuchsia-400 mt-0.5 font-medium">
                    Total ≈ {isInfinite ? maxAreaSum.toFixed(4) : maxAreaSum.toFixed(4)}
                </span>
            )}
        </div>
      </div>

      <div className="bg-white px-4 py-2 border-b border-fuchsia-50">
        <div className="flex items-center gap-4 text-xs select-none">
            <span className="text-gray-500 font-medium whitespace-nowrap">N = {isInfinite ? '∞' : levels}</span>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="range" 
                    min="2" max="50" 
                    value={levels} 
                    onChange={(e) => {
                        setLevels(Number(e.target.value));
                        if (isInfinite) setIsInfinite(false);
                    }}
                    disabled={isInfinite}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                        isInfinite ? 'bg-gray-100 accent-gray-300' : 'bg-fuchsia-100 accent-fuchsia-600'
                    }`}
                />
                <button
                    onClick={() => setIsInfinite(!isInfinite)}
                    title="Toggle Infinity"
                    className={`p-1 rounded border transition-all ${
                        isInfinite 
                        ? 'bg-fuchsia-600 text-white border-fuchsia-600' 
                        : 'bg-white text-gray-400 border-gray-200 hover:border-fuchsia-400 hover:text-fuchsia-600'
                    }`}
                >
                    <InfinityIcon size={14} />
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 overflow-hidden relative">
        
        {/* MODE 1: Measure Space (Dual Panel) */}
        {viewMode === 'measure' && (
            <>
                <div className="relative">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide flex justify-between">
                        <span>1. Slicing Range (Function Graph)</span>
                        <span>y = f(x)</span>
                    </h4>
                    <div className="h-[180px] w-full">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            {xTicksFunc.map(t => (
                                <g key={`xt-${t}`} transform={`translate(${xScaleFunc(t)},0)`}>
                                    <line y1={margin.top} y2={height - margin.bottom} stroke="#f1f5f9" />
                                    <text y={height - margin.bottom + 15} textAnchor="middle" fontSize="10" fill="#94a3b8">{t}</text>
                                </g>
                            ))}
                            {yTicksFunc.map(t => (
                                <g key={`yt-${t}`} transform={`translate(0,${yScaleFunc(t)})`}>
                                    <line x1={margin.left} x2={width - margin.right} stroke="#f1f5f9" />
                                    <text x={margin.left - 8} y={3} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
                                </g>
                            ))}

                            <line x1={margin.left} x2={width-margin.right} y1={yScaleFunc(0)} y2={yScaleFunc(0)} stroke="#cbd5e1" strokeWidth={1} />
                            <line x1={xScaleFunc(0)} x2={xScaleFunc(0)} y1={margin.top} y2={height-margin.bottom} stroke="#cbd5e1" strokeWidth={1} />

                            {!isDirichlet && (
                                <path d={lineGeneratorFunc(funcPoints) || ""} fill="none" stroke="#e879f9" strokeWidth={2} opacity={0.5} />
                            )}
                            <line 
                                x1={margin.left} x2={width-margin.right} 
                                y1={yScaleFunc(currentT)} y2={yScaleFunc(currentT)} 
                                stroke="#c026d3" strokeWidth={2} strokeDasharray="4 4"
                            />
                            {!isDirichlet && !isInfinite && (
                                Array.from({length: 100}).map((_, i) => {
                                    const segWidth = (config.domain[1] - config.domain[0]) / 100;
                                    const x = config.domain[0] + i * segWidth;
                                    if (config.fn(x) > currentT) {
                                        return (
                                            <rect 
                                                key={i}
                                                x={xScaleFunc(x)} 
                                                y={yScaleFunc(0) - 2} 
                                                width={Math.max(1, xScaleFunc(x + segWidth) - xScaleFunc(x))} 
                                                height={4} 
                                                fill="#d946ef"
                                            />
                                        )
                                    }
                                    return null;
                                })
                            )}
                            
                            {!isDirichlet && !isInfinite && measureSlices.map((slice, i) => (
                                <rect
                                    key={`approx-${i}`}
                                    x={xScaleFunc(config.domain[0])}
                                    y={yScaleFunc(slice.yBase + slice.height)}
                                    width={width - margin.left - margin.right}
                                    height={Math.abs(yScaleFunc(slice.yBase) - yScaleFunc(slice.yBase + slice.height))}
                                    fill="#f0abfc"
                                    fillOpacity={0.1}
                                />
                            ))}

                            <text x={margin.left + 10} y={yScaleFunc(currentT) - 5} fill="#c026d3" fontSize="10" fontWeight="bold">Coloring: t = {currentT.toFixed(2)}</text>
                            <text x={width-margin.right} y={height-5} textAnchor="end" fontSize="10" fill="#64748b" fontStyle="italic">x</text>
                            <text x={margin.left+10} y={margin.top} textAnchor="start" fontSize="10" fill="#64748b" fontStyle="italic">y</text>
                        </svg>
                    </div>
                    
                    {/* Updated Vertical Slider Labeling */}
                    <div className="absolute right-0 top-0 h-full flex flex-col justify-center pr-1 pb-[30px] pt-[15px]">
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 rotate-90 text-[10px] text-gray-500 font-semibold tracking-wide whitespace-nowrap origin-bottom">
                            Coloring ({progressPercent.toFixed(0)}%)
                        </div>
                        <input 
                            type="range" 
                            min={yMin} max={yMax} step={0.01}
                            value={currentT}
                            onChange={(e) => setProbeT(parseFloat(e.target.value))}
                            className="h-full -mr-8 appearance-none bg-gray-100 rounded-full w-2 outline-none slider-vertical opacity-50 hover:opacity-100 transition-opacity border border-gray-300"
                            style={{ writingMode: 'vertical-lr', direction: 'rtl', verticalAlign: 'middle' }}
                            title="Coloring by value levels (height), not by x-position."
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">2. Accumulating Measure (t-space)</h4>
                        <div className="text-xs text-fuchsia-700 font-mono">
                            μ(E_t) = <span className="font-bold">{currentMeasure.toFixed(3)}</span>
                        </div>
                    </div>
                    <div className="h-[180px] w-full">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            {xTicksMeasure.map(t => (
                                <g key={`xtm-${t}`} transform={`translate(${xScaleMeasure(t)},0)`}>
                                    <line y1={margin.top} y2={height - margin.bottom} stroke="#f1f5f9" />
                                    <text y={height - margin.bottom + 15} textAnchor="middle" fontSize="10" fill="#94a3b8">{t}</text>
                                </g>
                            ))}
                            {yTicksMeasure.map(m => (
                                <g key={`ytm-${m}`} transform={`translate(0,${yScaleMeasure(m)})`}>
                                    <line x1={margin.left} x2={width - margin.right} stroke="#f1f5f9" />
                                    <text x={margin.left - 8} y={3} textAnchor="end" fontSize="10" fill="#94a3b8">{m}</text>
                                </g>
                            ))}

                            <line x1={margin.left} x2={width-margin.right} y1={yScaleMeasure(0)} y2={yScaleMeasure(0)} stroke="#cbd5e1" />
                            <line x1={xScaleMeasure(yMin)} x2={xScaleMeasure(yMin)} y1={margin.top} y2={height-margin.bottom} stroke="#cbd5e1" />

                            {!isDirichlet && (
                                <path 
                                    d={areaGeneratorMeasure(measureCurvePoints) || ""} 
                                    fill={isInfinite ? "#f5d0fe" : "none"} // Fill only in infinite mode or always? The path uses areaGenerator which always closes to axis.
                                    stroke="#c026d3" 
                                    strokeWidth={2}
                                />
                            )}
                            
                            {/* In standard mode, we show the path stroke above. The slice bars do the filling. In infinite mode, we can fill the path itself. */}
                            {!isDirichlet && isInfinite && (
                                 <path 
                                    d={areaGeneratorMeasure(measureCurvePoints) || ""} 
                                    fill="#f5d0fe" 
                                    stroke="none"
                                />
                            )}


                            {!isDirichlet && (
                                <circle 
                                    cx={xScaleMeasure(currentT)} 
                                    cy={yScaleMeasure(currentMeasure)} 
                                    r={4} 
                                    fill="#a21caf" 
                                    stroke="white" 
                                    strokeWidth={2}
                                />
                            )}
                            
                            {!isDirichlet && !isInfinite && measureSlices.map((slice, i) => {
                                const x = xScaleMeasure(slice.yBase);
                                const w = xScaleMeasure(slice.yBase + slice.height) - x;
                                const h = yScaleMeasure(0) - yScaleMeasure(slice.measure);
                                
                                return (
                                    <rect 
                                        key={`m-rect-${i}`}
                                        x={x}
                                        y={yScaleMeasure(slice.measure)}
                                        width={Math.max(0, w)}
                                        height={h}
                                        fill="#d946ef"
                                        fillOpacity={0.3}
                                        stroke="white"
                                        strokeWidth={0.5}
                                    />
                                )
                            })}

                            <text x={width/2} y={height+5} textAnchor="middle" fontSize="10" fill="#64748b">Height (t)</text>
                            <text x={margin.left - 5} y={height/2} textAnchor="end" fontSize="10" fill="#64748b" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>Measure μ(t)</text>
                        </svg>
                    </div>
                </div>
            </>
        )}

        {/* MODE 2: Area Slicing (Single Panel) */}
        {viewMode === 'area' && (
             <div className="relative">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        Horizontal Slicing {'(Area A)'}
                         <button 
                            onClick={() => setIsCoarseMode(!isCoarseMode)}
                            disabled={isInfinite}
                            className={`ml-2 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-gray-300 transition-colors ${
                                isInfinite ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                         >
                            {isCoarseMode ? <Grid3X3 size={10} /> : <Waves size={10} />}
                            {isInfinite ? 'Continuous' : (isCoarseMode ? 'Coarse (Grid)' : 'Fine (Dynamic)')}
                         </button>
                    </h4>
                    
                    <div className="flex items-center gap-2 text-[9px] sm:text-[10px]">
                         {!isInfinite && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-slate-400 opacity-50"></div>
                                <span className="text-gray-500 hidden sm:inline">Value Layers</span>
                            </div>
                        )}
                        {!isInfinite && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: colorActiveFill }}></div>
                                <span className="text-gray-600 font-medium">One Slice</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: colorAccumulatedFill, opacity: colorAccumulatedOpacity }}></div>
                            <span className="text-gray-600 font-medium">Accumulated</span>
                        </div>
                    </div>
                </div>
                
                <div className="h-[300px] w-full relative">
                    <svg viewBox={`0 0 ${width} ${singlePanelHeight}`} className="w-full h-full overflow-visible">
                        {/* Grid */}
                        {xTicksFunc.map(t => (
                            <line key={`xga-${t}`} x1={xScaleFunc(t)} x2={xScaleFunc(t)} y1={margin.top} y2={singlePanelHeight - margin.bottom} stroke="#f8fafc" />
                        ))}
                        {yTicksArea.map(t => (
                            <line key={`yga-${t}`} x1={margin.left} x2={width - margin.right} y1={yScaleArea(t)} y2={yScaleArea(t)} stroke="#f8fafc" />
                        ))}

                        {/* Axes */}
                        <line x1={margin.left} x2={width-margin.right} y1={yScaleArea(0)} y2={yScaleArea(0)} stroke="#94a3b8" strokeWidth={1.5} />
                        <line x1={xScaleFunc(0)} x2={xScaleFunc(0)} y1={margin.top} y2={singlePanelHeight-margin.bottom} stroke="#94a3b8" strokeWidth={1.5} />

                        {/* ============ VISUALIZATION LAYERS ============ */}
                        {!isDirichlet && (
                            <>
                                {/* 0. LEBESGUE SHADOW LAYERS (Background) */}
                                <g className="lebesgue-shadow-layer">
                                    {/* Only render if not infinite and not Dirichlet, as per measureSlices logic */}
                                    {/* We use areaSlices (Layer Cake) which gives proper horizontal extent for simple function approximation scaffold */}
                                    {!isInfinite && areaSlices.map((slice, i) => {
                                        // Hide logic: if the top of the slice is below or equal to currentT, it's washed away.
                                        const sliceTopVal = slice.yBase + slice.height;
                                        if (sliceTopVal <= currentT) return null;

                                        const yTop = yScaleArea(sliceTopVal);
                                        const yBottom = yScaleArea(slice.yBase);
                                        const h = Math.abs(yBottom - yTop);

                                        return (
                                            <g key={`shadow-layer-${i}`}>
                                                {slice.segments.map((seg, j) => {
                                                    const x = xScaleFunc(seg[0]);
                                                    const w = xScaleFunc(seg[1]) - x;
                                                    return (
                                                        <rect
                                                            key={`shadow-rect-${i}-${j}`}
                                                            x={x}
                                                            y={yTop}
                                                            width={Math.max(0, w)}
                                                            height={h}
                                                            fill={colorShadowLayer}
                                                            fillOpacity={opacityShadowLayer}
                                                            stroke="none"
                                                        />
                                                    );
                                                })}
                                            </g>
                                        );
                                    })}
                                </g>

                                {/* 1. ACCUMULATED AREA */}
                                {/* In Infinite Mode, act like Fine mode but clip to whole area if we want total area, OR clip to currentT if we want to show accumulation relative to slider. */}
                                {/* The prompt implies slider moves "Accumulated area". */}
                                
                                {(!isCoarseMode || isInfinite) ? (
                                    <defs>
                                        <clipPath id="accumulatedClip">
                                            <rect x={margin.left} y={yScaleArea(currentT)} width={width} height={Math.max(0, yScaleArea(0) - yScaleArea(currentT))} />
                                        </clipPath>
                                    </defs>
                                ) : null}

                                {/* Draw accumulated area */}
                                {!isInfinite && isCoarseMode ? (
                                    // Coarse Mode: Draw previous slices
                                    areaSlices.map((slice, i) => {
                                        const sliceTop = slice.yBase + slice.height;
                                        const activeIndex = Math.floor((currentT - areaYMin) / slice.height);
                                        const isBelow = i < activeIndex;

                                        if (!isBelow) return null;

                                        const y = yScaleArea(sliceTop);
                                        const h = yScaleArea(slice.yBase) - y;
                                        
                                        return (
                                            <g key={`acc-slice-${i}`}>
                                                {slice.segments.map((seg, j) => {
                                                    const x = xScaleFunc(seg[0]);
                                                    const w = xScaleFunc(seg[1]) - x;
                                                    return (
                                                        <rect 
                                                            key={`acc-rect-${i}-${j}`}
                                                            x={x}
                                                            y={y}
                                                            width={Math.max(0, w)}
                                                            height={h}
                                                            fill={colorAccumulatedFill}
                                                            fillOpacity={colorAccumulatedOpacity}
                                                            stroke="none"
                                                        />
                                                    )
                                                })}
                                            </g>
                                        )
                                    })
                                ) : (
                                    // Fine/Dynamic/Infinite Mode: Draw smooth area clipped
                                    <g clipPath="url(#accumulatedClip)">
                                         <path 
                                            d={areaGeneratorAccumulated(funcPoints) || ""} 
                                            fill={colorAccumulatedFill} 
                                            fillOpacity={colorAccumulatedOpacity}
                                            stroke="none" 
                                        />
                                    </g>
                                )}

                                {/* 2. ACTIVE SLICE (dt) - Hide in infinite mode */}
                                {!isInfinite && (
                                    isCoarseMode ? (
                                        // Coarse Mode: Find the specific grid slice
                                        areaSlices.map((slice, i) => {
                                            const activeIndex = Math.floor((currentT - areaYMin) / slice.height);
                                            if (i !== activeIndex) return null;
    
                                            const y = yScaleArea(slice.yBase + slice.height);
                                            const h = yScaleArea(slice.yBase) - y;
                                            
                                            return (
                                                <g key={`act-slice-${i}`}>
                                                    {slice.segments.map((seg, j) => {
                                                        const x = xScaleFunc(seg[0]);
                                                        const w = xScaleFunc(seg[1]) - x;
                                                        return (
                                                            <rect 
                                                                key={`act-rect-${i}-${j}`}
                                                                x={x}
                                                                y={y}
                                                                width={Math.max(0, w)}
                                                                height={h}
                                                                fill={colorActiveFill}
                                                                fillOpacity={0.9}
                                                                stroke={colorActiveStroke}
                                                                strokeWidth={1}
                                                            />
                                                        )
                                                    })}
                                                     <text x={width - margin.right + 5} y={y + h/2 + 4} fontSize="10" fill={colorActiveFill} fontWeight="bold">
                                                        dt
                                                     </text>
                                                </g>
                                            )
                                        })
                                    ) : (
                                        // Fine Mode: Draw the dynamically computed slice at currentT
                                        dynamicActiveSlice && dynamicActiveSlice.segments.map((seg, j) => {
                                            const x = xScaleFunc(seg[0]);
                                            const w = xScaleFunc(seg[1]) - x;
                                            const yTop = yScaleArea(dynamicActiveSlice.yBase + dynamicActiveSlice.height);
                                            const yBase = yScaleArea(dynamicActiveSlice.yBase);
                                            const h = yBase - yTop;
    
                                            return (
                                                <g key={`dyn-act-${j}`}>
                                                    <rect 
                                                        x={x}
                                                        y={yTop}
                                                        width={Math.max(0, w)}
                                                        height={h}
                                                        fill={colorActiveFill}
                                                        fillOpacity={0.9}
                                                        stroke={colorActiveStroke}
                                                        strokeWidth={1}
                                                    />
                                                </g>
                                            )
                                        })
                                    )
                                )}
                            </>
                        )}
                        
                        {/* Function Curve Overlay (Outline only) */}
                        {!isDirichlet && (
                            <path d={lineGeneratorArea(funcPoints) || ""} fill="none" stroke="#334155" strokeWidth={1.5} opacity={0.2} strokeDasharray="3 3"/>
                        )}

                        {/* Probe Line */}
                        <line 
                            x1={margin.left} x2={width-margin.right} 
                            y1={yScaleArea(currentT)} y2={yScaleArea(currentT)} 
                            stroke="#c026d3" strokeWidth={2} strokeDasharray="4 2"
                        />
                        <text x={margin.left + 5} y={yScaleArea(currentT) - 5} fill="#c026d3" fontSize="11" fontWeight="bold">Coloring: t = {currentT.toFixed(2)}</text>
                        
                        {/* Dynamic Label for Active Slice properties */}
                         {!isDirichlet && !isInfinite && (
                             <g transform={`translate(${width - 120}, ${margin.top + 20})`}>
                                <rect width="110" height="40" rx="4" fill="white" fillOpacity="0.9" stroke="#f0abfc" />
                                <text x="10" y="16" fontSize="10" fill="#64748b">Active Slice (dt)</text>
                                <text x="10" y="30" fontSize="10" fill={colorActiveStroke} fontWeight="bold">
                                    Width ≈ {isCoarseMode 
                                        ? calculateMeasure(config.fn, config.domain, currentT - (currentT % dt)).toFixed(3) // Approximate grid measure
                                        : dynamicActiveSlice?.measure.toFixed(3)
                                    }
                                </text>
                             </g>
                         )}
                        

                        {/* Ticks Labels */}
                        {xTicksFunc.map(t => (
                            <text key={`xtl-${t}`} x={xScaleFunc(t)} y={singlePanelHeight - margin.bottom + 15} textAnchor="middle" fontSize="10" fill="#64748b">{t}</text>
                        ))}
                        {yTicksArea.map(t => (
                            <text key={`ytl-${t}`} x={margin.left - 8} y={yScaleArea(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">{t}</text>
                        ))}
                    </svg>

                     {/* On-Canvas Label for Accumulated (Centered in bottom area) */}
                    {!isDirichlet && currentT > areaYMin + 0.1 && (
                        <div 
                            className="absolute pointer-events-none text-center"
                            style={{ 
                                left: `${width/2}px`, 
                                top: `${yScaleArea(currentT/2)}px`, 
                                transform: 'translate(-50%, -50%)',
                                opacity: 0.7
                            }}
                        >
                            <span className="text-[10px] font-bold text-fuchsia-800 bg-white/50 px-1 rounded block">Accumulated Area</span>
                        </div>
                    )}
                     {!isDirichlet && !isInfinite && (
                        <div 
                            className="absolute pointer-events-none"
                            style={{ 
                                left: `${width - margin.right + 5}px`, 
                                top: `${yScaleArea(currentT) - 25}px`, 
                            }}
                        >
                             <span className="text-[10px] font-bold text-fuchsia-600 block whitespace-nowrap">Active dt</span>
                        </div>
                    )}
                    
                </div>

                {/* Vertical Slider labeled as Coloring */}
                 <div className="absolute right-0 top-[40px] bottom-[30px] w-8 flex flex-col justify-center">
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 rotate-90 text-[10px] text-gray-500 font-semibold tracking-wide whitespace-nowrap origin-bottom">
                        Coloring ({progressPercent.toFixed(0)}%)
                    </div>
                    <input 
                        type="range" 
                        min={yMin} max={yMax} step={0.01}
                        value={currentT}
                        onChange={(e) => setProbeT(parseFloat(e.target.value))}
                        className="h-full appearance-none bg-gray-100 rounded-full w-2 outline-none slider-vertical opacity-50 hover:opacity-100 transition-opacity border border-gray-300 mx-auto"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                        title="Coloring by value levels (height), not by x-position."
                    />
                </div>

                <div className="mt-4 p-3 bg-fuchsia-50 rounded-lg text-sm text-fuchsia-900 border border-fuchsia-100">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide opacity-70">
                         {isInfinite ? 'Continuous limit (N → ∞)' : (isCoarseMode ? 'Coarse Slicing (Grid)' : 'Fine Slicing (Dynamic)')}
                    </p>
                    {isInfinite ? (
                        <p className="text-xs leading-relaxed opacity-90">
                           At the limit, the horizontal slices become infinitely thin ($dt \to 0$). The "Accumulated Area" perfectly matches the area under the curve.
                        </p>
                    ) : (
                        <p className="text-xs leading-relaxed opacity-90">
                            The <strong style={{color: colorActiveStroke}}>dark band</strong> represents <strong>dt</strong>. 
                            The <span style={{color: '#c026d3', opacity: 0.7}}>light region</span> is the sum of previous slices.
                            The <span className="text-slate-500">gray layers</span> represent the remaining value steps.
                        </p>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};