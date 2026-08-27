// A row of mango-leaf/marigold bunting, like the toranam garlands strung
// across doorways during the festival. Used under the header as the app's
// signature structural device instead of a generic gradient divider.
export default function Toranam() {
  const leaves = Array.from({ length: 14 });
  return (
    <div className="toranam" aria-hidden="true">
      <svg viewBox="0 0 420 20" preserveAspectRatio="none">
        <path d="M0,1 Q210,18 420,1" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
        {leaves.map((_, i) => {
          const x = (420 / (leaves.length - 1)) * i;
          const dip = Math.sin((i / (leaves.length - 1)) * Math.PI) * 11;
          const y = 1 + dip;
          const color = i % 2 === 0 ? '#F6B93B' : '#3E6B4F';
          return (
            <path
              key={i}
              d={`M${x},${y} q-5,7 0,13 q5,-6 0,-13 Z`}
              fill={color}
              transform={`rotate(${i % 2 === 0 ? -8 : 8}, ${x}, ${y})`}
            />
          );
        })}
      </svg>
    </div>
  );
}