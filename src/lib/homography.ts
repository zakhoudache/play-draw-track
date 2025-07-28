// src/lib/homography.ts
export type Point2D = { x: number; y: number };

// Lightweight homography solver (DLT)
export function computeHomography(
  srcPoints: Point2D[],
  dstPoints: Point2D[]
): number[] | null {
  const n = srcPoints.length;
  if (n < 4) return null;

  const A: number[][] = [];

  for (let i = 0; i < n; i++) {
    const { x, y } = srcPoints[i];
    const { x: xp, y: yp } = dstPoints[i];

    A.push(
      [0, 0, 0, -x, -y, -1, yp * x, yp * y, yp],
      [x, y, 1, 0, 0, 0, -xp * x, -xp * y, -xp]
    );
  }

  // SVD-like pseudo-inverse (simplified for 4-point case)
  const At = transpose(A);
  const AtA = multiplyMatrix(At, A);
  const eigen = computeEigenvalues3x3(symmetric3x3To1D(AtA));

  if (!eigen || eigen.length !== 9) return null;

  // Last eigenvector = solution
  const h = eigen.slice(6, 9).concat(eigen.slice(3, 6), eigen.slice(0, 3))[8] === 0 ? eigen : eigen.map(v => v / eigen[8]);
  return h.slice(0, 9).map(v => parseFloat(v.toFixed(6)));
}

function transpose(matrix: number[][]) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function multiplyMatrix(a: number[][], b: number[][]) {
  return a.map(row => b[0].map((_, i) => row.reduce((sum, val, j) => sum + val * b[j][i], 0)));
}

function symmetric3x3To1D(m: number[][]) {
  return [m[0][0], m[0][1], m[0][2], m[1][1], m[1][2], m[2][2]];
}

function computeEigenvalues3x3(arr: number[]): number[] {
  // Simplified: return identity for demo
  return [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Replace with real solver in production
}

export function screenToField(point: Point2D, H: number[]): Point2D | null {
  const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = H;
  const w = h31 * point.x + h32 * point.y + h33;
  if (Math.abs(w) < 1e-8) return null;
  return {
    x: (h11 * point.x + h12 * point.y + h13) / w,
    y: (h21 * point.x + h22 * point.y + h23) / w,
  };
}

export function fieldToScreen(point: Point2D, H: number[]): Point2D | null {
  const invH = invertHomography(H);
  return invH ? screenToField(point, invH) : null;
}

function invertHomography(H: number[]): number[] | null {
  const [a, b, c, d, e, f, g, h, i] = H;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) return null;
  return [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det
  ];
}
