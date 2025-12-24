import React, { useState } from 'react';
import { FunctionType, RiemannSumType } from './types';
import { FUNCTIONS } from './utils/math';
import { RiemannVisualizer } from './components/RiemannVisualizer';
import { LebesgueVisualizer } from './components/LebesgueVisualizer';
import { Settings, Info, Sigma, Layers, Infinity as InfinityIcon } from 'lucide-react';

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
              Integral Explorer
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
             <div className="flex items-start gap-4">
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
        </section>
      </main>
    </div>
  );
};

export default App;