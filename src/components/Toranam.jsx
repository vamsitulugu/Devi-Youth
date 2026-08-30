// A row of mango-leaf/marigold bunting, like the toranam garlands strung
// across doorways during the festival. Used under the header as the app's
// signature structural device instead of a generic gradient divider.
export default function Toranam() {
  const leaves = Array.from({ length: 14 });
  const width = 420;
  const height = 30;
  return (
    <div className="toranam" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path
          d={`M0,2 Q${width / 2},${height - 4} ${width},2`}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />
        {leaves.map((_, i) => {
          const x = (width / (leaves.length - 1)) * i;
          const dip = Math.sin((i / (leaves.length - 1)) * Math.PI) * (height * 0.35);
          const y = 2 + dip;
          const color = i % 2 === 0 ? '#F6B93B' : '#3E6B4F';
          return (
            <path
              key={i}
              className="toranam-leaf"
              style={{ animationDelay: `${(i % 4) * 0.3}s` }}
              d={`M${x},${y} q-6,8 0,15 q6,-7 0,-15 Z`}
              fill={color}
              transform={`rotate(${i % 2 === 0 ? -8 : 8}, ${x}, ${y})`}
            />
          );
        })}
      </svg>
    </div>
  );
}