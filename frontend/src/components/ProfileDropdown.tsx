import { useLanguage } from '../i18n/LanguageContext'

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

export function ProfileDropdown({
  email,
  onOpenSettings,
  onOpenApplications,
  onLogout,
}: {
  email: string
  onOpenSettings: () => void
  onOpenApplications: () => void
  onLogout: () => void
}) {
  const { t } = useLanguage()

  return (
    <div className="group relative">
      <button
        title={email}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-panel-border text-muted transition-colors group-hover:border-accent group-hover:text-accent"
      >
        <ProfileIcon />
      </button>

      {/* Pont invisible perque el hover no es talli entre el boto i el menu */}
      <div className="absolute right-0 top-full h-2 w-40" />

      <div className="invisible absolute right-0 top-full z-50 w-48 rounded-md border border-panel-border bg-panel py-1 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
        <p className="truncate border-b border-panel-border px-3 py-2 font-mono text-[10px] text-muted">
          {email}
        </p>
        <button
          onClick={onOpenSettings}
          className="block w-full px-3 py-2 text-left text-xs text-paper transition-colors hover:bg-ink hover:text-accent"
        >
          {t.auth.profileSettings}
        </button>
        <button
          onClick={onOpenApplications}
          className="block w-full px-3 py-2 text-left text-xs text-paper transition-colors hover:bg-ink hover:text-accent"
        >
          {t.auth.myApplications}
        </button>
        <button
          onClick={onLogout}
          className="block w-full px-3 py-2 text-left text-xs text-paper transition-colors hover:bg-ink hover:text-accent"
        >
          {t.auth.logout}
        </button>
      </div>
    </div>
  )
}
