import { FunctionConfig, FunctionType, Point } from '../types';

export const FUNCTIONS: Record<FunctionType, FunctionConfig> = {
  [FunctionType.X_SQUARED]: {
    id: FunctionType.X_SQUARED,
    name: 'f(x) = x²',
    latex: 'x^2',
    description: 'A standard continuous function. Ideal for seeing convergence.',
    fn: (x: number) => x * x,
    domain: [0, 1],
    range: [0, 1.2],
  },
  [FunctionType.SINE]: {
    id: FunctionType.SINE,
    name: 'f(x) = sin(πx)',
    latex: '\\sin(\\pi x)',
    description: 'A symmetric curve. Shows how rectangles approximate curvature.',
    fn: (x: number) => Math.sin(Math.PI * x),
    domain: [0, 2],
    range: [-1.2, 1.2],
  },
  [FunctionType.LINEAR]: {
    id: FunctionType.LINEAR,
    name: 'f(x) = 2x',
    latex: '2x',
    description: 'Linear growth.',
    fn: (x: number) => 2 * x,
    domain: [0, 1],
    range: [0, 2.2],
  },
  [FunctionType.QUADRATIC_PEAK]: {
    id: FunctionType.QUADRATIC_PEAK,
    name: 'f(x) = -(x - 3)² + 4',
    latex: '-(x-3)^2 + 4',
    description: 'Symmetric hill shape. Great for visualizing horizontal slices.',
    fn: (x: number) => -Math.pow(x - 3, 2) + 4,
    domain: [1, 5],
    range: [0, 4.5],
  },
  [FunctionType.STEP]: {
    id: FunctionType.STEP,
    name: 'Step Function',
    latex: 'f(x)',
    description: 'A function with jumps. Lebesgue handles the flat regions naturally.',
    fn: (x: number) => {
        if (x < 0.3) return 0.2;
        if (x < 0.7) return 0.8;
        return 0.5;
    },
    domain: [0, 1],
    range: [0, 1],
  },
  [FunctionType.DIRICHLET]: {
    id: FunctionType.DIRICHLET,
    name: 'Dirichlet Function',
    latex: '1_{\\mathbb{Q}}(x)',
    description: '1 if rational, 0 if irrational. Riemann fails here!',
    fn: (x: number) => {
        // We cannot truly simulate this on a computer, but we return a visual proxy
        return Math.random() > 0.5 ? 1 : 0; 
    },
    domain: [0, 1],
    range: [0, 1.2],
  },
};

export const generatePoints = (
  fn: (x: number) => number,
  domain: [number, number],
  steps: number = 200
): Point[] => {
  const points: Point[] = [];
  const start = domain[0];
  const end = domain[1];
  const stepSize = (end - start) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const x = start + i * stepSize;
    points.push({ x, y: fn(x) });
  }
  return points;
};

// Calculate the Lebesgue measure of the set { x | f(x) > t }
export const calculateMeasure = (
    fn: (x: number) => number,
    domain: [number, number],
    t: number,
    samples: number = 400
): number => {
    const dx = (domain[1] - domain[0]) / samples;
    let measure = 0;
    for (let i = 0; i < samples; i++) {
        const x = domain[0] + i * dx;
        if (fn(x) > t) {
            measure += dx;
        }
    }
    return measure;
};

// Generate points for the Measure vs Height graph (Rotated: y=t, x=measure)
export const getMeasureCurve = (
    fn: (x: number) => number,
    domain: [number, number],
    yRange: [number, number],
    steps: number = 100
): Point[] => {
    const points: Point[] = [];
    const dt = (yRange[1] - yRange[0]) / steps;
    
    // We scan t from min to max
    for(let i=0; i<=steps; i++) {
        const t = yRange[0] + i * dt;
        const mu = calculateMeasure(fn, domain, t);
        points.push({ x: t, y: mu });
    }
    return points;
};

export const integrateMeasureCurve = (
    fn: (x: number) => number,
    domain: [number, number],
    yRange: [number, number]
): number => {
    const steps = 400;
    const dt = (yRange[1] - yRange[0]) / steps;
    let sum = 0;
    for(let i=0; i<steps; i++) {
        const t = yRange[0] + (i + 0.5) * dt;
        const mu = calculateMeasure(fn, domain, t);
        sum += mu * dt;
    }
    return sum;
};


// Helper for Lebesgue simple function approximation (Horizontal Layers)
// Standard Simple Function: Partition range, sets are E_i = { x | y_i <= f(x) < y_{i+1} }
export const getLebesgueSlices = (
    fn: (x: number) => number,
    domain: [number, number],
    yRange: [number, number],
    levels: number
) => {
    const slices = [];
    const dy = (yRange[1] - yRange[0]) / levels; 
    
    const samples = 400;
    const dx = (domain[1] - domain[0]) / samples;
    
    for (let i = 0; i < levels; i++) {
        const yLower = yRange[0] + i * dy;
        const yUpper = yLower + dy;
        
        let currentStart = -1;
        let measure = 0;
        const segments: [number, number][] = [];

        for (let j = 0; j <= samples; j++) {
            const x = domain[0] + j * dx;
            const y = fn(x);
            // Condition for disjoint partition (Simple Function)
            const inRange = y >= yLower && (i === levels - 1 ? y <= yUpper + 0.001 : y < yUpper);

            if (inRange) {
                if (currentStart === -1) currentStart = x;
                measure += dx;
            } else {
                if (currentStart !== -1) {
                    segments.push([currentStart, x]);
                    currentStart = -1;
                }
            }
        }
        if (currentStart !== -1) {
            segments.push([currentStart, domain[1]]);
        }
        
        slices.push({
            yBase: yLower,
            height: dy,
            segments,
            measure
        });
    }
    return slices;
};

// Helper for "Area Slicing" visualization (Layer Cake)
// Slices correspond to horizontal strips covering { x | f(x) >= y }
export const getLayerCakeSlices = (
    fn: (x: number) => number,
    domain: [number, number],
    yRange: [number, number],
    levels: number
) => {
    const slices = [];
    const dy = (yRange[1] - yRange[0]) / levels;
    const samples = 400;
    const dx = (domain[1] - domain[0]) / samples;

    for (let i = 0; i < levels; i++) {
        const yLower = yRange[0] + i * dy;
        
        let currentStart = -1;
        let measure = 0;
        const segments: [number, number][] = [];

        for (let j = 0; j <= samples; j++) {
            const x = domain[0] + j * dx;
            const y = fn(x);
            // Condition for Layer Cake: f(x) >= yLower
            // We focus on the region 0 <= t <= f(x), so if yLower < 0 and f(x) is higher, it counts.
            const inRange = y >= yLower;

            if (inRange) {
                if (currentStart === -1) currentStart = x;
                measure += dx;
            } else {
                if (currentStart !== -1) {
                    segments.push([currentStart, x]);
                    currentStart = -1;
                }
            }
        }
        if (currentStart !== -1) {
            segments.push([currentStart, domain[1]]);
        }
        
        slices.push({
            yBase: yLower,
            height: dy,
            segments,
            measure
        });
    }
    return slices;
};

// Compute a single slice at arbitrary t with height dt
export const getSliceGeometry = (
    fn: (x: number) => number,
    domain: [number, number],
    t: number,
    dt: number
) => {
    const samples = 400;
    const dx = (domain[1] - domain[0]) / samples;
    
    let currentStart = -1;
    const segments: [number, number][] = [];
    let measure = 0;

    for (let j = 0; j <= samples; j++) {
        const x = domain[0] + j * dx;
        const y = fn(x);
        const inRange = y >= t; 

        if (inRange) {
            if (currentStart === -1) currentStart = x;
            measure += dx;
        } else {
            if (currentStart !== -1) {
                segments.push([currentStart, x]);
                currentStart = -1;
            }
        }
    }
    if (currentStart !== -1) {
        segments.push([currentStart, domain[1]]);
    }
    
    return {
        yBase: t,
        height: dt,
        segments,
        measure
    };
};
