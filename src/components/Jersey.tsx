'use client';

import { colorsFor } from '@/lib/clubColors';

export default function Jersey({
  clubShort,
  position,
  size = 44,
}: {
  clubShort: string;
  position: string;
  size?: number;
}) {
  const { shirt, trim, sleeve } = colorsFor(clubShort, position);

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="drop-shadow">
      {/* sleeves */}
      <path d="M8 18 L20 10 L24 18 L16 26 Z" fill={sleeve ?? trim} />
      <path d="M56 18 L44 10 L40 18 L48 26 Z" fill={sleeve ?? trim} />
      {/* body */}
      <path
        d="M20 10 C24 14 40 14 44 10 L48 18 L44 22 L44 54 C44 56 20 56 20 54 L20 22 L16 18 Z"
        fill={shirt}
        stroke={trim}
        strokeWidth="1.5"
      />
      {/* collar */}
      <path d="M26 10 C28 14 36 14 38 10 L34 14 L30 14 Z" fill={trim} />
    </svg>
  );
}
