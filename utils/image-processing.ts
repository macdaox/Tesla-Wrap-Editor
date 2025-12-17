
export interface Point {
  x: number;
  y: number;
}

/**
 * Detects a region from a given point on an image using Flood Fill + Boundary Tracing.
 * 
 * @param ctx The 2D context of the source image/canvas
 * @param startX Click X
 * @param startY Click Y
 * @param width Canvas width
 * @param height Canvas height
 * @param tolerance Color tolerance (0-255)
 */
export function detectRegion(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  width: number,
  height: number,
  tolerance: number = 40 // Reduced tolerance back to 40 to prevent leaks, relying on stroke for gaps
): Point[] | null {
  // Check unused vars
  // width is used in getImageData, height is used in getImageData.
  // wait, linter said width is unused? Ah, maybe in the function signature if I didn't use it?
  // But I am using it: ctx.getImageData(0, 0, width, height)
  // Maybe it was referring to another width?
  // Let's ignore it for now or just suppress.
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 1. Get Start Color
  const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];
  
  const startBrightness = (startR + startG + startB) / 3;
  const isStartLight = startBrightness > 150; // Heuristic: filling a light area?

  // If transparent or black (line), ignore
  // Actually, lines are usually non-white. Let's assume we want to select white-ish areas.
  // But let's be generic: select area of "similar color".
  
  const visited = new Uint8Array(width * height); // 0 = unvisited, 1 = visited (region)
  
  const stack = [Math.floor(startX), Math.floor(startY)];
  // const regionPoints: Point[] = []; // We might not need to store all, but useful for bounding box
  
  // Flood Fill (BFS) to mark the region
  // Using a Uint8Array for visited is fast.
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  
  const matchColor = (pos: number) => {
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];
      
      // Hard stop at dark lines if we started in a light area
      // This prevents leaking through anti-aliased grey pixels of lines
      if (isStartLight) {
          const brightness = (r + g + b) / 3;
          if (brightness < 100) return false;
      }
      
      // Simple Euclidean distance or Manhattan
      const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
      return diff <= tolerance * 4; // *4 because 4 channels
  };
  
  // Optimization: Don't store all points in array if not needed, but we need visited mask for tracing.
  
  while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      
      const pos = (y * width + x) * 4;
      const visitedIdx = y * width + x;
      
      if (visited[visitedIdx]) continue;
      
      if (matchColor(pos)) {
          visited[visitedIdx] = 1;
          
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          
          // Add neighbors
          if (x > 0) { stack.push(x - 1, y); }
          if (x < width - 1) { stack.push(x + 1, y); }
          if (y > 0) { stack.push(x, y - 1); }
          if (y < height - 1) { stack.push(x, y + 1); }
      }
  }
  
  // If region is too small, ignore
  if (maxX - minX < 5 || maxY - minY < 5) return null;

  // 2. Boundary Tracing (Moore-Neighbor Tracing) on the 'visited' mask
  // We need to find a starting pixel for the boundary.
  // We can scan from minX, minY.
  
  let boundaryStart: Point | null = null;
  
  // Find top-left most pixel of the region
  outer: for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
          if (visited[y * width + x]) {
              boundaryStart = { x, y };
              break outer;
          }
      }
  }
  
  if (!boundaryStart) return null;
  
  const contour: Point[] = [];
  const startP = boundaryStart;
  let currP = startP;
  // Start searching from "West" (relative to current pixel entering from empty space)
  // Actually standard Moore tracing start direction depends on how we found the pixel.
  // Since we scanned from top-left, we entered from Top or Left.
  // Let's use standard direction codes: 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
  // But easier with offsets.
  
  // Clockwise Moore Neighborhood:
  // P1 P2 P3
  // P8 P  P4
  // P7 P6 P5
  const offsets = [
      {x: 0, y: -1}, // N
      {x: 1, y: -1}, // NE
      {x: 1, y: 0},  // E
      {x: 1, y: 1},  // SE
      {x: 0, y: 1},  // S
      {x: -1, y: 1}, // SW
      {x: -1, y: 0}, // W
      {x: -1, y: -1} // NW
  ];
  
  let backtrackDir = 6; // Start checking from West (since we found pixel from left scan)
  
  // Limit iterations to prevent infinite loop
  const maxIter = (width * height);
  let iter = 0;
  
  do {
      contour.push({ x: currP.x, y: currP.y });
      
      let foundNext = false;
      // Check 8 neighbors in clockwise order starting from backtrackDir
      for (let i = 0; i < 8; i++) {
          const checkDir = (backtrackDir + i) % 8;
          const off = offsets[checkDir];
          const nx = currP.x + off.x;
          const ny = currP.y + off.y;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (visited[ny * width + nx]) {
                  // Found next boundary pixel
                  currP = { x: nx, y: ny };
                  // New backtrack direction is (current_dir + 4) % 8, then -2 (counter clockwise)??
                  // Actually, for Moore: enter from dir D, start checking from (D + 4 + 1) % 8 ?
                  // A simpler heuristic: Point to the neighbor we came from, then turn clockwise.
                  // If we moved N (0), we came from S. So next time check neighbors starting from W (6) -> NW -> N ...
                  // The standard is: if we moved in direction D, next search starts at (D + 5) % 8 ? No.
                  
                  // Correct Moore:
                  // If we found neighbor at direction D (0..7), next search starts at (D + 5) % 8 ??
                  // Actually, let's just stick to:
                  // Backtrack = (checkDir + 4 + 1) % 8 ? 
                  // Let's try: Backtrack = (checkDir + 6) % 8 (which is -2 steps, i.e., 90 deg CCW from entrance)
                  backtrackDir = (checkDir + 5) % 8; 
                  foundNext = true;
                  break;
              }
          }
      }
      
      if (!foundNext) break; // Isolated pixel?
      iter++;
      
  } while ((currP.x !== startP.x || currP.y !== startP.y) && iter < maxIter);
  
  // Simplify Contour (Douglas-Peucker) - Simple version: remove collinear points
  if (contour.length < 3) return null;
  
  const simplified: Point[] = [];
  simplified.push(contour[0]);
  
  for (let i = 1; i < contour.length - 1; i++) {
      // Very basic: skip if distance to last added point is too small (downsampling)
      const last = simplified[simplified.length - 1];
      const curr = contour[i];
      const dist = Math.abs(curr.x - last.x) + Math.abs(curr.y - last.y);
      if (dist > 1) { // Reduced from 5px to 1px to preserve details
          simplified.push(curr);
      }
  }
  simplified.push(contour[contour.length - 1]);
  
  return simplified;
}
