'use client';

import { useState } from 'react';
import Jersey from './Jersey';

// FPL's own frontend serves shirt art from this path, keyed by each club's
// "code" (not its id) plus a goalkeeper variant suffix. This is an unofficial,
// undocumented asset path — if it ever changes or 404s for a given club, we
// fall back to the drawn SVG jersey below rather than showing a broken image.
function shirtUrl(clubCode: number, position: string) {
  const suffix = position === 'GK' ? '_1' : '';
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${clubCode}${suffix}-66.png`;
}

export default function ShirtImage({
  clubCode,
  clubShort,
  position,
  size = 44,
}: {
  clubCode?: number | null;
  clubShort: string;
  position: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!clubCode || failed) {
    return <Jersey clubShort={clubShort} position={position} size={size} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shirtUrl(clubCode, position)}
      alt={`${clubShort} shirt`}
      width={size}
      height={size}
      className="object-contain drop-shadow"
      onError={() => setFailed(true)}
    />
  );
}
