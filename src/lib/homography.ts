export interface Point {
  x: number;
  y: number;
}

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

  private static solve(A: number[][]): number[] | null {
    const n = A.length;
    const m = A[0].length;
    const b = A.map(row => -row[m - 1]);
    const M = A.map(row => row.slice(0, m - 1));

    // Simple Gaussian elimination
    for (let i = 0; i < m - 1; i++) {
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

    const x = Array(m - 1).fill(0);
    for (let i = m - 2; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < m - 1; j++) sum += M[i][j] * x[j];
      if (Math.abs(M[i][i]) < 1e-10) return null;
      x[i] = (b[i] - sum) / M[i][i];
    }
    return x;
  }

  static invert(H: number[]): number[] | null {
    const h = [...H];
    if (h.length === 8) h.push(1); // Ensure 3x3

    const det = h[0] * (h[4] * h[8] - h[7] * h[5]) - 
               h[1] * (h[3] * h[8] - h[5] * h[6]) + 
               h[2] * (h[3] * h[7] - h[4] * h[6]);
    
    if (Math.abs(det) < 1e-10) return null;
    const invDet = 1 / det;
    
    return [
      (h[4] * h[8] - h[7] * h[5]) * invDet, 
      (h[2] * h[7] - h[1] * h[8]) * invDet, 
      (h[1] * h[5] - h[2] * h[4]) * invDet,
      (h[5] * h[6] - h[3] * h[8]) * invDet, 
      (h[0] * h[8] - h[2] * h[6]) * invDet, 
      (h[3] * h[2] - h[0] * h[5]) * invDet,
      (h[3] * h[7] - h[6] * h[4]) * invDet, 
      (h[6] * h[1] - h[0] * h[7]) * invDet, 
      (h[0] * h[4] - h[3] * h[1]) * invDet
    ];
  }

  static transform(point: Point, h: number[]): Point {
    if (!h || h.length < 9) return { x: 0, y: 0 };
    const { x, y } = point;
    const w = h[6] * x + h[7] * y + h[8];
    if (Math.abs(w) < 1e-10) return { x: Infinity, y: Infinity };
    return {
      x: (h[0] * x + h[1] * y + h[2]) / w,
      y: (h[3] * x + h[4] * y + h[5]) / w
    };
  }
}

// Football field reference points based on calibration mode
export const getFieldReferencePoints = (mode: string) => {
  const L = 105; // Length in meters
  const W = 68;  // Width in meters
  const R = 9.15; // Center circle radius

  switch (mode) {
    case "away-goal":
      return [
        { x: 0, y: W/2 - 9.16 },     // Small goal area top-left
        { x: 5.5, y: W/2 - 9.16 },   // Small goal area top-right
        { x: 0, y: W/2 + 9.16 },     // Small goal area bottom-left
        { x: 5.5, y: W/2 + 9.16 },   // Small goal area bottom-right
        { x: 0, y: W/2 - 20.16 },    // Large goal area top-left
        { x: 16.5, y: W/2 - 20.16 }, // Large goal area top-right
        { x: 0, y: W/2 + 20.16 },    // Large goal area bottom-left
        { x: 16.5, y: W/2 + 20.16 }  // Large goal area bottom-right
      ];
    
    case "home-goal":
      return [
        { x: L, y: W/2 - 9.16 },       // Small goal area top-right
        { x: L - 5.5, y: W/2 - 9.16 }, // Small goal area top-left
        { x: L, y: W/2 + 9.16 },       // Small goal area bottom-right
        { x: L - 5.5, y: W/2 + 9.16 }, // Small goal area bottom-left
        { x: L, y: W/2 - 20.16 },      // Large goal area top-right
        { x: L - 16.5, y: W/2 - 20.16 }, // Large goal area top-left
        { x: L, y: W/2 + 20.16 },      // Large goal area bottom-right
        { x: L - 16.5, y: W/2 + 20.16 }  // Large goal area bottom-left
      ];
    
    case "center-circle":
    default:
      return [
        { x: L/2, y: W/2 },           // Center spot
        { x: L/2, y: W/2 - R },       // Center circle top
        { x: L/2 + R, y: W/2 },       // Center circle right
        { x: L/2, y: W/2 + R },       // Center circle bottom
        { x: L/2 - R, y: W/2 },       // Center circle left
        { x: L/2, y: 0 },             // Top touchline midpoint
        { x: L/2, y: W }              // Bottom touchline midpoint
      ];
  }
};