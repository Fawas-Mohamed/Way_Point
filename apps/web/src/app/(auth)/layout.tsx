export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink-slate px-12 py-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(600px 400px at 20% 10%, rgba(55,48,165,0.35), transparent)" }}
          aria-hidden="true"
        />
        <a href="/" className="relative flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="4" cy="18" r="2.5" fill="#0F9D6E" />
            <circle cx="11" cy="10" r="2.5" fill="#0F9D6E" />
            <circle cx="18" cy="4" r="3" fill="#3730A5" />
            <path d="M6 16.5L9.5 12M13 8.5L16 5.5" stroke="#0F9D6E" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[19px] font-medium text-white">Waypoint</span>
        </a>

        <div className="relative max-w-sm">
          <p className="font-display text-[28px] leading-[36px] text-white">
            &ldquo;Every project has a route. Waypoint just makes it visible.&rdquo;
          </p>
          <p className="mt-4 text-caption text-white/50">Priya Sharma, Senior Project Manager</p>
        </div>

        <div className="relative">
          <svg viewBox="0 0 320 32" className="w-full max-w-xs" aria-hidden="true">
            <line x1={8} y1={16} x2={140} y2={16} stroke="#0F9D6E" strokeWidth={3} strokeLinecap="round" />
            <line x1={140} y1={16} x2={312} y2={16} stroke="rgba(255,255,255,0.15)" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 10" />
            <circle cx={8} cy={16} r={6} fill="#0F9D6E" />
            <circle cx={80} cy={16} r={6} fill="#0F9D6E" />
            <circle cx={140} cy={16} r={9} fill="#0F9D6E" />
            <circle cx={140} cy={16} r={14} fill="none" stroke="#0F9D6E" strokeOpacity={0.3} strokeWidth={4} />
            <circle cx={220} cy={16} r={6} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
            <circle cx={312} cy={16} r={6} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
          </svg>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
