// Enhanced Homography implementation for football field perspective correction
export interface Point {
  x: number;
  y: number;
}

// Keep the original Point2D for backward compatibility
export type Point2D = Point;

export class Homography {
  static compute(srcPoints: Point[], dstPoints: Point[]): number[] | null {
    const n = srcPoints.length;
    if (n < 4) return null;

    const A: number[][] = [];
    for (let i = 0; i < n; i++) {
      const { x: x1, y: y1 } = srcPoints[i];
      const { x: x2, y: y2 } = dstPoints[i];
      A.push([-x1, -y1, -1, 0, 0, 0, x1 * x2, y1 * x2, x2]);
      A.push([0, 0, 0, -x1, -y1, -1, x1 * y2, y1 * y2, y2]);
    }

    const h = this.solve(A);
    if (!h) return null;
    return [...h, 1]; // Append h_88 = 1
  }
  
  static solve(A: number[][]): number[] | null {
    const n = A.length;
    const m = A[0].length;
    const b = A.map(row => -row[m-1]);
    const M = A.map(row => row.slice(0, m-1));
    
    // Simple Gaussian elimination
    for (let i = 0; i < Math.min(n, m - 1); i++) {
      let max = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(M[j][i]) > Math.abs(M[max][i])) max = j;
      }
      [M[i], M[max]] = [M[max], M[i]];
      [b[i], b[max]] = [b[max], b[i]];
      
      if (Math.abs(M[i][i]) < 1e-10) continue;
      
      for (let j = i + 1; j < n; j++) {
        const f = M[j][i] / M[i][i];
        for (let k = i; k < m - 1; k++) M[j][k] -= M[i][k] * f;
        b[j] -= b[i] * f;
      }
    }
    
    const x = Array(m-1).fill(0);
    for (let i = Math.min(n, m - 2); i >= 0; i--) {
      if (Math.abs(M[i][i]) < 1e-10) continue;
      let sum = 0;
      for (let j = i + 1; j < m - 1; j++) sum += M[i][j] * x[j];
      x[i] = (b[i] - sum) / M[i][i];
    }
    return x;
  }

  static invert(H: number[]): number[] | null {
    const h = [...H];
    if (h.length === 8) h.push(1); // Ensure 3x3
    const det = h[0]*(h[4]*h[8]-h[7]*h[5]) - h[1]*(h[3]*h[8]-h[5]*h[6]) + h[2]*(h[3]*h[7]-h[4]*h[6]);
    if (Math.abs(det) < 1e-10) return null;
    const invDet = 1 / det;
    return [
      (h[4]*h[8] - h[7]*h[5]) * invDet, (h[2]*h[7] - h[1]*h[8]) * invDet, (h[1]*h[5] - h[2]*h[4]) * invDet,
      (h[5]*h[6] - h[3]*h[8]) * invDet, (h[0]*h[8] - h[2]*h[6]) * invDet, (h[3]*h[2] - h[0]*h[5]) * invDet,
      (h[3]*h[7] - h[6]*h[4]) * invDet, (h[6]*h[1] - h[0]*h[7]) * invDet, (h[0]*h[4] - h[3]*h[1]) * invDet
    ];
  }

  static transform(p: Point, h: number[]): Point {
    if (!h || h.length < 9) return { x: 0, y: 0 };
    const { x, y } = p;
    const w = h[6] * x + h[7] * y + h[8];
    if (Math.abs(w) < 1e-10) return { x: Infinity, y: Infinity };
    return {
      x: (h[0] * x + h[1] * y + h[2]) / w,
      y: (h[3] * x + h[4] * y + h[5]) / w
    };
  }
}

// Enhanced field calibration points for better accuracy
export const CALIBRATION_PROMPTS = [
  "Click the <strong>Center Spot</strong> of the pitch",
  "Click the <strong>Top</strong> of the Center Circle (closest to goal)",
  "Click the <strong>Right</strong> point of the Center Circle",
  "Click the <strong>Bottom</strong> of the Center Circle (furthest from goal)", 
  "Click the <strong>Left</strong> point of the Center Circle",
  "Click the <strong>Midpoint</strong> of the <strong>Top Touchline</strong>",
  "Click the <strong>Midpoint</strong> of the <strong>Bottom Touchline</strong>"
];

// Destination points in real-world coordinates (meters)
export const CALIBRATION_DST_POINTS: Point[] = [
  { x: 52.5, y: 34 },     // Center Spot
  { x: 52.5, y: 24.85 },  // Center Circle Top
  { x: 61.65, y: 34 },    // Center Circle Right
  { x: 52.5, y: 43.15 },  // Center Circle Bottom
  { x: 43.35, y: 34 },    // Center Circle Left
  { x: 52.5, y: 0 },      // Top Touchline Midpoint
  { x: 52.5, y: 68 }      // Bottom Touchline Midpoint
];

// Legacy functions for backward compatibility
export function computeHomography(srcPoints: Point2D[], dstPoints: Point2D[]): number[] | null {
  return Homography.compute(srcPoints, dstPoints);
}

export function screenToField(point: Point2D, H: number[]): Point2D | null {
  const result = Homography.transform(point, H);
  return result.x === Infinity ? null : result;
}

export function fieldToScreen(point: Point2D, H: number[]): Point2D | null {
  const invH = Homography.invert(H);
  return invH ? screenToField(point, invH) : null;
}
