function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken px-4 text-text-primary">
      <div className="flex items-center gap-3 rounded-md border border-surface-border bg-surface-base px-4 py-3 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-surface-border border-t-brand-primary" />
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
    </div>
  );
}

export default Spinner;
