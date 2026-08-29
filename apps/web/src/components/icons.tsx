/** Icônes SVG maison — trait 2, rondes, héritent de currentColor. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IcClock({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IcImport({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <path d="M12 15V4" />
      <path d="M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function IcExport({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <path d="M12 4v10" />
      <path d="M7.5 9.5L12 14l4.5-4.5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function IcSearch({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L20 20" />
    </svg>
  );
}

export function IcSun({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19" />
    </svg>
  );
}

export function IcMoon({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

export function IcSystem({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IcSignOut({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M17 8l4 4-4 4" />
      <path d="M21 12H10" />
    </svg>
  );
}

export function IcBack({ size = 20 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} aria-hidden>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </svg>
  );
}
