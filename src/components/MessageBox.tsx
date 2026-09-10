'use client';

export default function MessageBox({
  text,
  type,
  onDismiss,
  className = '',
}: {
  text: string;
  type: 'error' | 'success';
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 text-sm rounded-lg px-4 py-3 border ${
        type === 'success'
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-fpl-pink/10 border-fpl-pink text-fpl-pink'
      } ${className}`}
    >
      <span>{text}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}