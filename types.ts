export enum FunctionType {
  X_SQUARED = 'x_squared',
  SINE = 'sine',
  LINEAR = 'linear',
  DIRICHLET = 'dirichlet', // The tricky one
  STEP = 'step',
  QUADRATIC_PEAK = 'quadratic_peak'
}

export interface FunctionConfig {
  id: FunctionType;
  name: string;
  latex: string;
  description: string;
  fn: (x: number) => number;
  domain: [number, number]; // [min, max]
  range: [number, number];  // [min, max]
}

export enum RiemannSumType {
  LEFT = 'left',
  RIGHT = 'right',
  MIDPOINT = 'midpoint'
}

export interface Point {
  x: number;
  y: number;
}