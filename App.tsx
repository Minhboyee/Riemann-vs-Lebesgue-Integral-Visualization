import React, { useState, useRef, useEffect } from 'react';
import { FunctionType, RiemannSumType } from './types';
import { FUNCTIONS } from './utils/math';
import { RiemannVisualizer } from './components/RiemannVisualizer';
import { LebesgueVisualizer } from './components/LebesgueVisualizer';
import { Settings, Info, Sigma, Layers, Infinity as InfinityIcon } from 'lucide-react';

// Simple KaTeX Wrapper Component
const Latex = ({ formula, className = '' }: { formula: string, className?: string }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if ((window as any).katex) {
      try {
        // use renderToString to avoid "KaTeX doesn't work in quirks mode" error
        // which can happen in some environments even with valid doctype if katex.render is used directly
        const rendered = (window as any).katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false
        });
        setHtml(rendered);
      } catch (e) {
        console.error("KaTeX error:", e);
        setHtml(formula); // Fallback to plain text
      }
    } else {
        setHtml(formula);
    }
  }, [formula]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

const App: React.FC = () => {
  const [selectedFunc, setSelectedFunc] = useState<FunctionType>(FunctionType.X_SQUARED);
  const [riemannPartitions, setRiemannPartitions] = useState<number>(10);
  const [riemannType, setRiemannType] = useState<RiemannSumType>(RiemannSumType.LEFT);
  const [isRiemannInfinite, setIsRiemannInfinite] = useState<boolean>(false);
  const [lebesgueLevels, setLebesgueLevels] = useState<number>(5);
  const [isLebesgueInfinite, setIsLebesgueInfinite] = useState<boolean>(false);

  const config = FUNCTIONS[selectedFunc];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">∫</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Integral Explorer - MinhAI2
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Riemann vs. Lebesgue Intuition
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Controls Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Function Selection */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Settings size={16} /> Select Function
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.values(FUNCTIONS).map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setSelectedFunc(f.id)}
                                className={`px-3 py-2 rounded-lg text-sm border text-left transition-all ${
                                    selectedFunc === f.id 
                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                            >
                                <div className="font-semibold">{f.name}</div>
                                <div className="text-xs opacity-75 truncate">{f.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Specific Controls */}
                <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                    
                    {/* Riemann Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                                <Sigma size={16}/> Riemann Settings
                            </label>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Vertical Cuts</span>
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-slate-500 block">
                                    Partitions (n): <span className="font-mono text-slate-700">{isRiemannInfinite ? '∞' : riemannPartitions}</span>
                                </label>
                                <button
                                    onClick={() => setIsRiemannInfinite(true)}
                                    disabled={isRiemannInfinite}
                                    title="Set n to infinity"
                                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                                        isRiemannInfinite 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-inner' 
                                        : 'bg-white text-blue-600 border-blue-200 hover:border-blue-500 hover:bg-blue-50'
                                    }`}
                                >
                                    <span>n →</span>
                                    <InfinityIcon size={14} />
                                </button>
                            </div>
                            <input 
                                type="range" 
                                min="2" 
                                max="100" 
                                value={riemannPartitions} 
                                onChange={(e) => {
                                    setRiemannPartitions(Number(e.target.value));
                                    setIsRiemannInfinite(false);
                                }}
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                    isRiemannInfinite ? 'bg-slate-100 accent-slate-300' : 'bg-slate-200 accent-blue-600'
                                }`}
                            />
                        </div>

                        <div>
                             <label className="text-xs text-slate-500 mb-1 block">Sum Type</label>
                             <div className="flex rounded-md shadow-sm" role="group">
                                {[RiemannSumType.LEFT, RiemannSumType.MIDPOINT, RiemannSumType.RIGHT].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setRiemannType(type)}
                                        className={`px-3 py-1 text-xs font-medium border first:rounded-l-lg last:rounded-r-lg flex-1 capitalize ${
                                            riemannType === type 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Lebesgue Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-fuchsia-700 flex items-center gap-2">
                                <Layers size={16}/> Lebesgue Settings
                            </label>
                            <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">Horizontal Cuts</span>
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-slate-500 block">
                                    Value Levels (Layers): <span className="font-mono text-slate-700">{isLebesgueInfinite ? '∞' : lebesgueLevels}</span>
                                </label>
                                <button
                                    onClick={() => setIsLebesgueInfinite(true)}
                                    disabled={isLebesgueInfinite}
                                    title="Set levels to infinity"
                                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                                        isLebesgueInfinite 
                                        ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-inner' 
                                        : 'bg-white text-fuchsia-600 border-fuchsia-200 hover:border-fuchsia-500 hover:bg-fuchsia-50'
                                    }`}
                                >
                                    <span>N →</span>
                                    <InfinityIcon size={14} />
                                </button>
                            </div>
                            <input 
                                type="range" 
                                min="2" 
                                max="50" 
                                value={lebesgueLevels} 
                                onChange={(e) => {
                                    setLebesgueLevels(Number(e.target.value));
                                    setIsLebesgueInfinite(false);
                                }}
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                    isLebesgueInfinite ? 'bg-slate-100 accent-slate-300' : 'bg-slate-200 accent-fuchsia-600'
                                }`}
                            />
                        </div>
                        
                        <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded border border-slate-100">
                            "Partition the range (y-axis), then measure the sets on domain (x-axis)."
                        </div>
                    </div>

                </div>
            </div>
        </section>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RiemannVisualizer 
                config={config} 
                partitions={riemannPartitions} 
                setPartitions={setRiemannPartitions}
                sumType={riemannType}
                isInfinite={isRiemannInfinite}
                setIsInfinite={setIsRiemannInfinite}
            />
            <LebesgueVisualizer 
                config={config} 
                levels={lebesgueLevels} 
                setLevels={setLebesgueLevels}
                isInfinite={isLebesgueInfinite}
                setIsInfinite={setIsLebesgueInfinite}
            />
        </div>

        {/* Info/Footer */}
        <section className="bg-indigo-900 text-white rounded-2xl p-8 shadow-xl">
             <div className="flex items-start gap-4 mb-10">
                <Info className="flex-shrink-0 mt-1" />
                <div>
                    <h3 className="text-lg font-bold mb-2">The Intuitive Difference</h3>
                    <p className="text-indigo-200 mb-4 leading-relaxed">
                        Imagine you are counting money.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/10 p-4 rounded-xl">
                            <strong className="block text-blue-300 mb-1">Riemann Way</strong>
                            <p className="text-sm opacity-90">You take the bills from your pocket one by one in random order, adding their value to the sum as you go.</p>
                            <p className="text-xs mt-2 text-blue-200 font-mono">Sum = Σ f(x_i) Δx</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-xl">
                            <strong className="block text-fuchsia-300 mb-1">Lebesgue Way</strong>
                            <p className="text-sm opacity-90">You sort the bills into piles ($1s, $5s, $10s), count how many are in each pile, multiply by the face value, and add the results.</p>
                            <p className="text-xs mt-2 text-fuchsia-200 font-mono">Sum = Σ y_j · Measure({'{'}x : f(x) ≈ y_j{'}'})</p>
                        </div>
                    </div>
                </div>
             </div>

             {/* Comparison Table 1 */}
             <div className="border-t border-indigo-700/50 pt-8">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">Riemann Integral vs Lebesgue Integral</h3>
                    <p className="text-indigo-300 text-sm">Same area. Different way of counting.</p>
                </div>

                <div className="overflow-x-auto bg-white/5 rounded-xl border border-indigo-700/50">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-indigo-200 uppercase bg-indigo-800/50">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-wider">Aspect</th>
                                <th className="px-6 py-4 font-bold text-blue-300 tracking-wider">Riemann Integral</th>
                                <th className="px-6 py-4 font-bold text-fuchsia-300 tracking-wider">Lebesgue Integral</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-800/50">
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Core question</td>
                                <td className="px-6 py-3 text-indigo-100/90">“At each position x, how high is the function?”</td>
                                <td className="px-6 py-3 text-indigo-100/90">“For each value (height), how much space does it occupy?”</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Coloring intuition</td>
                                <td className="px-6 py-3 text-indigo-100/90">Coloring <strong className="text-white">by position</strong> – left to right (x-axis)</td>
                                <td className="px-6 py-3 text-indigo-100/90">Coloring <strong className="text-white">by value</strong> – bottom to top (value / height axis)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">How the domain is partitioned</td>
                                <td className="px-6 py-3 text-indigo-100/90">Partition the <strong className="text-white">x-axis</strong> (domain)</td>
                                <td className="px-6 py-3 text-indigo-100/90">Partition the <strong className="text-white">value axis</strong> (range / levels)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">What is being summed</td>
                                <td className="px-6 py-3 text-indigo-100/90 font-mono text-xs">Vertical rectangles: f(xᵢ) · Δx</td>
                                <td className="px-6 py-3 text-indigo-100/90 font-mono text-xs">Measure of level sets: μ{'{'}x : f(x) &gt; t{'}'} · dt</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Role of rectangles</td>
                                <td className="px-6 py-3 text-indigo-100/90">Rectangles are the <strong className="text-white">foundation</strong> of the definition</td>
                                <td className="px-6 py-3 text-indigo-100/90">Rectangles are <strong className="text-white">only a visualization aid</strong></td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Meaning of dx / dt</td>
                                <td className="px-6 py-3 text-indigo-100/90"><span className="font-mono">dx</span> = real geometric width</td>
                                <td className="px-6 py-3 text-indigo-100/90"><span className="font-mono">dt</span> = notation for integration by measure (not a shape)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Sensitivity to discontinuities</td>
                                <td className="px-6 py-3 text-indigo-100/90">Highly sensitive; may fail</td>
                                <td className="px-6 py-3 text-indigo-100/90">Robust; ignores changes on measure-zero sets</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Changing the function on a few points</td>
                                <td className="px-6 py-3 text-indigo-100/90">Can break integrability</td>
                                <td className="px-6 py-3 text-indigo-100/90">Has no effect on the integral</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Dirichlet function</td>
                                <td className="px-6 py-3 text-red-300 font-bold">❌ Not integrable</td>
                                <td className="px-6 py-3 text-green-300 font-bold">✅ Integrable (pure measure logic)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Function “niceness” required</td>
                                <td className="px-6 py-3 text-indigo-100/90">Needs relative smoothness</td>
                                <td className="px-6 py-3 text-indigo-100/90">Only requires measurability</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Mathematical nature</td>
                                <td className="px-6 py-3 text-indigo-100/90">Limit of geometric sums</td>
                                <td className="px-6 py-3 text-indigo-100/90">Integral with respect to a measure</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Relationship to probability</td>
                                <td className="px-6 py-3 text-indigo-100/90">Not natural</td>
                                <td className="px-6 py-3 text-indigo-100/90">Natural (expectation, distributions)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Typical use cases</td>
                                <td className="px-6 py-3 text-indigo-100/90">Intro calculus, simple geometry</td>
                                <td className="px-6 py-3 text-indigo-100/90">Modern analysis, probability, ML, Fourier</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">One-line summary</td>
                                <td className="px-6 py-3 text-indigo-100 italic">“Sum heights at positions”</td>
                                <td className="px-6 py-3 text-indigo-100 italic">“Sum space occupied by values”</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 text-center space-y-1">
                    <p className="text-xl font-medium text-white">Riemann and Lebesgue integrate the same area.</p>
                    <p className="text-indigo-300">They differ in the question they ask.</p>
                </div>
             </div>

             {/* Comparison Table 2 - Formulas */}
             <div className="border-t border-indigo-700/50 mt-12 pt-12">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">Riemann Integral vs Lebesgue Integral Formula (Layer-Cake Form)</h3>
                    <p className="text-indigo-300 text-sm">Same area. Different direction of sweep.</p>
                </div>

                <div className="overflow-x-auto bg-white/5 rounded-xl border border-indigo-700/50">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-indigo-200 uppercase bg-indigo-800/50">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-wider">Aspect</th>
                                <th className="px-6 py-4 font-bold text-blue-300 tracking-wider">Riemann Integral</th>
                                <th className="px-6 py-4 font-bold text-fuchsia-300 tracking-wider">Lebesgue Integral (Layer-Cake)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-800/50">
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-indigo-200">Integral formula</td>
                                <td className="px-6 py-4 text-indigo-100/90">
                                    <Latex formula={`\\displaystyle \\int_a^b f(x)\\,dx`} />
                                </td>
                                <td className="px-6 py-4 text-indigo-100/90">
                                    <Latex formula={`\\displaystyle \\int_0^{\\infty} \\mu\\{x\\in[a,b] : f(x) > t\\}\\,dt`} />
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">What is being swept</td>
                                <td className="px-6 py-3 text-indigo-100/90"><strong className="text-white">Position (x)</strong></td>
                                <td className="px-6 py-3 text-indigo-100/90"><strong className="text-white">Value (t)</strong></td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Meaning of the variable</td>
                                <td className="px-6 py-3 text-indigo-100/90"><Latex formula="x" />: a point in the domain</td>
                                <td className="px-6 py-3 text-indigo-100/90"><Latex formula="t" />: a value (height level)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Direction of sweep</td>
                                <td className="px-6 py-3 text-indigo-100/90">Along the <strong className="text-white">x-axis</strong> (left → right)</td>
                                <td className="px-6 py-3 text-indigo-100/90">Along the <strong className="text-white">value axis</strong> (bottom → top)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Meaning of integration bounds</td>
                                <td className="px-6 py-3 text-indigo-100/90">Bounds <Latex formula="[a,b]" /> reflect the <strong className="text-white">domain</strong></td>
                                <td className="px-6 py-3 text-indigo-100/90">Bounds <Latex formula={'[0,\\infty)'} /> reflect the <strong className="text-white">range of values</strong></td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">What is accumulated</td>
                                <td className="px-6 py-3 text-indigo-100/90">Values of the function at positions</td>
                                <td className="px-6 py-3 text-indigo-100/90">Measure of sets where the function exceeds a value</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Geometric intuition</td>
                                <td className="px-6 py-3 text-indigo-100/90">Vertical accumulation (columns)</td>
                                <td className="px-6 py-3 text-indigo-100/90">Horizontal accumulation (layers / slices)</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-indigo-200">Conceptual summary</td>
                                <td className="px-6 py-3 text-indigo-100 italic">“Scan the graph by position”</td>
                                <td className="px-6 py-3 text-indigo-100 italic">“Stack layers by value”</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-8 text-center space-y-1">
                    <p className="text-indigo-200">Riemann: the bounds reflect the domain.</p>
                    <p className="text-white font-medium">Lebesgue: the bounds reflect the value range of the function.</p>
                </div>
             </div>
        </section>
      </main>
    </div>
  );
};

export default App;