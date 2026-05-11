/**
 * Inline SVG sparkline. Per brand rules: bone for positive, muted for negative,
 * no red/green. No fills, no gradients.
 */

export function Sparkline({
  values,
  width = 80,
  height = 24,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (!values || values.length < 2) {
    return (
      <span className="text-muted text-xs font-display italic">—</span>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const endValue = values[values.length - 1];
  const isPositive = endValue >= 0;
  const stroke = isPositive ? "#F0EDE8" : "#a8a39c";
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((endValue - min) / range) * height;

  return (
    <svg
      width={width}
      height={height}
      className="inline-block align-middle"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isPositive ? 0.85 : 0.6}
      />
      {/* End-dot marks the latest value */}
      <circle cx={lastX} cy={lastY} r="1.6" fill={isPositive ? "#C6AB5C" : stroke} />
    </svg>
  );
}
