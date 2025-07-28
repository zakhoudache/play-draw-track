// src/lib/soccerField.ts
import { Point2D } from "./homography";

const FIELD_WIDTH = 105;  // meters
const FIELD_HEIGHT = 68;

export const SOCCER_FIELD_KEYPOINTS: Point2D[] = [
  { x: 0, y: 0 },           // TL
  { x: FIELD_WIDTH, y: 0 }, // TR
  { x: FIELD_WIDTH, y: FIELD_HEIGHT }, // BR
  { x: 0, y: FIELD_HEIGHT }, // BL
];

// Optional: Add center circle, penalty box, etc.
export function getSoccerFieldMarkings() {
  return [
    // Outer lines
    { x1: 0, y1: 0, x2: 105, y2: 0 },
    { x1: 105, y1: 0, x2: 105, y2: 68 },
    { x1: 105, y1: 68, x2: 0, y2: 68 },
    { x1: 0, y1: 68, x2: 0, y2: 0 },
    // Center line
    { x1: 52.5, y1: 0, x2: 52.5, y2: 68 },
    // Center circle
    { cx: 52.5, cy: 34, r: 9.15 },
  ];
}
