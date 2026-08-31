/** Small hand-rolled SVG bar chart — no chart library dependency. Values
 * animate in from zero. `data` is [{label, value}], `color` any CSS color
 * (var(--color-...) works). */
export default function MiniBarChart({ data, color = 'var(--color-vermillion)', height = 96 }) {
  if (!data?.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const colW = 30;
  const barW = 18;
  const chartH = height - 18;

  return (
    <svg viewBox={`0 0 ${data.length * colW} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * chartH);
        const x = i * colW + (colW - barW) / 2;
        return (
          <g key={i}>
            <rect x={x} y={chartH - h} width={barW} height={h} rx="4" fill={color} opacity="0.88">
              <animate attributeName="height" from="0" to={h} dur="0.6s" begin={`${i * 40}ms`} fill="freeze" />
              <animate attributeName="y" from={chartH} to={chartH - h} dur="0.6s" begin={`${i * 40}ms`} fill="freeze" />
            </rect>
            <text x={x + barW / 2} y={height - 3} textAnchor="middle" fontSize="9" fill="var(--color-ink-soft)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
