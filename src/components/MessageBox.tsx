'use client';

export default function MessageBox({
  text,
  type,
  onDismiss,
}: {
  text: string;
  type: 'error' | 'success';
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-8 z-50 flex justify-center px-4 pointer-events-none">
      <div className="relative bg-white rounded-2xl shadow-2xl px-6 py-6 max-w-sm w-full pointer-events-auto">
        <button
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl leading-none"
        >
          ✕
        </button>
        <h3 className={`text-2xl font-extrabold mb-2 pr-6 ${type === 'success' ? 'text-green-600' : 'text-fpl-pink'}`}>
          {type === 'success' ? 'Success!' : 'Heads up'}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed pr-2">{text}</p>
      </div>
    </div>
  );
}