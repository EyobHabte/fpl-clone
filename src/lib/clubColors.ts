export interface ClubColors {
  shirt: string;
  trim: string;
  sleeve?: string;
}

// Approximate primary kit colors, keyed by FPL short club codes.
// Falls back to a neutral purple/grey kit for any club not listed.
export const CLUB_COLORS: Record<string, ClubColors> = {
  ARS: { shirt: '#EF0107', trim: '#FFFFFF' },
  AVL: { shirt: '#670E36', trim: '#95BFE5' },
  BOU: { shirt: '#DA291C', trim: '#000000' },
  BRE: { shirt: '#E30613', trim: '#FFFFFF', sleeve: '#FBB800' },
  BHA: { shirt: '#0057B8', trim: '#FFFFFF', sleeve: '#FFCD00' },
  BUR: { shirt: '#6C1D45', trim: '#99D6EA' },
  CHE: { shirt: '#034694', trim: '#FFFFFF' },
  CRY: { shirt: '#1B458F', trim: '#C4122E' },
  EVE: { shirt: '#003399', trim: '#FFFFFF' },
  FUL: { shirt: '#FFFFFF', trim: '#000000' },
  IPS: { shirt: '#0044A9', trim: '#FFFFFF' },
  LEE: { shirt: '#FFCD00', trim: '#1D428A' },
  LEI: { shirt: '#003090', trim: '#FDBE11' },
  LIV: { shirt: '#C8102E', trim: '#00B2A9' },
  MCI: { shirt: '#6CABDD', trim: '#1C2C5B' },
  MUN: { shirt: '#DA291C', trim: '#FBE122' },
  NEW: { shirt: '#241F20', trim: '#FFFFFF', sleeve: '#241F20' },
  NFO: { shirt: '#DD0000', trim: '#FFFFFF' },
  SOU: { shirt: '#D71920', trim: '#130C0E' },
  SUN: { shirt: '#EB172B', trim: '#FFFFFF' },
  TOT: { shirt: '#FFFFFF', trim: '#132257' },
  WHU: { shirt: '#7A263A', trim: '#1BB1E7' },
  WOL: { shirt: '#FDB913', trim: '#231F20' },
};

export const GK_COLORS: ClubColors = { shirt: '#2E2E2E', trim: '#39FF88' };

export function colorsFor(clubShort: string, position: string): ClubColors {
  if (position === 'GK') return GK_COLORS;
  return CLUB_COLORS[clubShort] ?? { shirt: '#37003C', trim: '#00FF85' };
}
