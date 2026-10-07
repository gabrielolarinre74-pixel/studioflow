export function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-md shadow-blue-600/25">
        <svg viewBox="0 0 24 24" className="size-5 fill-white" aria-hidden>
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="9.5" y="4" width="5" height="10" rx="1.5" opacity=".85" />
          <rect x="16" y="4" width="5" height="6" rx="1.5" opacity=".7" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="font-bold tracking-tight">StudioFlow</p>
        {subtitle && <p className="text-xs text-muted-foreground">by Gabriel.ATH</p>}
      </div>
    </div>
  );
}
