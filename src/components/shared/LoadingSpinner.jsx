export const LoadingSpinner = ({ label = 'Yükleniyor...' }) => (
  <div
    className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-slate"
    role="status"
    aria-live="polite"
  >
    <span className="size-4 animate-spin rounded-full border-2 border-tide/25 border-t-tide" />
    <span>{label}</span>
  </div>
);
