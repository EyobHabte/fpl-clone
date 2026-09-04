export function playerPhotoUrl(photoCode: string | null) {
  if (!photoCode) return null;
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoCode}.png`;
}
