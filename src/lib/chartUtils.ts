export function floorToStep(x: number, step: number): number {
  return Math.floor(x / step) * step;
}

export function ceilToStep(x: number, step: number): number {
  return Math.ceil(x / step) * step;
}

export function dynamicDomain(vals: number[], padAbs = 2): [number, number] {
  if (vals.length === 0) return [0, 100];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  const pad = Math.max(padAbs, range * 0.08);
  return [
    Math.round((min - pad) * 10) / 10,
    Math.round((max + pad) * 10) / 10,
  ];
}

export function dynamicTightWeight(vals: number[]): [number, number] {
  if (vals.length === 0) return [60, 120];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  const padding = Math.max(0.3, range * 0.25);
  let yMin = floorToStep(min - padding, 0.5);
  let yMax = ceilToStep(max + padding, 0.5);
  if (yMax - yMin < 1.0) {
    const mid = (min + max) / 2;
    yMin = floorToStep(mid - 0.5, 0.5);
    yMax = ceilToStep(mid + 0.5, 0.5);
  }
  return [yMin, yMax];
}

export function dynamicTightSleep(vals: number[]): [number, number] {
  if (vals.length === 0) return [0, 14];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  const padding = Math.max(0.5, range * 0.3);
  const yMin = Math.max(0, floorToStep(min - padding, 0.5));
  const yMax = ceilToStep(max + padding, 0.5);
  return [yMin, yMax];
}

export function scaleFixed(min: number, max: number): () => [number, number] {
  return () => [min, max];
}
