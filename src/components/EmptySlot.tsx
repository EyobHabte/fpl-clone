'use client';

export default function EmptySlot({ position, onClick }: { position: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-20 h-24 sm:w-24 sm:h-28 rounded-lg border-2 border-dashed border-white/50 bg-white/10 hover:bg-white/20 transition-colors text-white"
    >
      <span className="text-xl leading-none mb-1">+</span>
      <span className="text-[10px] sm:text-xs font-bold">{position}</span>
    </button>
  );
}
