interface RouteLineProps {
  /** Total number of waypoints (milestones/segments) on this route. */
  total: number;
  /** How many are complete. */
  completed: number;
  className?: string;
}

/**
 * The design system's signature element (see DESIGN_SYSTEM.md). Renders a
 * horizontal path with nodes: completed segments in Emerald Route, the
 * current position as a larger ringed node, remaining segments dotted in
 * hairline gray. Used everywhere the product would otherwise show a
 * generic progress bar.
 */
export function RouteLine({ total, completed, className }: RouteLineProps) {
  const safeTotal = Math.max(total, 1);
  const clampedCompleted = Math.min(completed, safeTotal);
  const isComplete = clampedCompleted >= safeTotal && safeTotal > 0;

  const nodes = Array.from({ length: safeTotal }, (_, i) => i);
  const positions = nodes.map((i) => (safeTotal === 1 ? 16 : 16 + (i * (568 / (safeTotal - 1)))));
  const currentIndex = Math.min(clampedCompleted, safeTotal - 1);
  const lineEndX = clampedCompleted === 0 ? 16 : positions[Math.min(clampedCompleted - 1, positions.length - 1)];

  return (
    <svg
      viewBox="0 0 600 32"
      className={className}
      style={{ width: "100%", height: 28 }}
      role="img"
      aria-label={`${clampedCompleted} of ${safeTotal} waypoints complete`}
    >
      {/* Remaining path, dotted */}
      <line x1={16} y1={16} x2={584} y2={16} stroke="#E4E7EC" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 10" />
      {/* Completed path, solid emerald */}
      {clampedCompleted > 0 && (
        <line x1={16} y1={16} x2={lineEndX} y2={16} stroke="#0F9D6E" strokeWidth={3} strokeLinecap="round" />
      )}
      {positions.map((x, i) => {
        const isDone = i < clampedCompleted;
        const isCurrent = i === currentIndex && !isComplete;
        if (isCurrent) {
          return (
            <g key={i}>
              <circle cx={x} cy={16} r={14} fill="none" stroke="#3730A5" strokeOpacity={0.25} strokeWidth={4} />
              <circle cx={x} cy={16} r={9} fill="#3730A5" />
            </g>
          );
        }
        if (isDone && i === clampedCompleted - 1 && isComplete) {
          return <circle key={i} cx={x} cy={16} r={9} fill="#0F9D6E" />;
        }
        return (
          <circle
            key={i}
            cx={x}
            cy={16}
            r={6}
            fill={isDone ? "#0F9D6E" : "#FFFFFF"}
            stroke={isDone ? "none" : "#E4E7EC"}
            strokeWidth={isDone ? 0 : 2}
          />
        );
      })}
    </svg>
  );
}
