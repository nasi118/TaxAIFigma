import type { NavSection } from '../App'

const ACTIVE_MATTER = {
  id: '2024-EST-0047',
  name: 'Estate of Harold W. Thornton III',
  type: 'Estate Tax — Form 706',
}

interface NavItem {
  id: NavSection
  label: string
  icon: React.ReactNode
  badge?: string | number
  badgeType?: 'alert' | 'count' | 'ai'
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25"/>
    </svg>
  )
}

function MattersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

function ResearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M5 6.5h3M6.5 5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

function AnalysisIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M4 10l2.5-3L9 9l2-2.5 1.5 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function WorkpaperIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3h12M2 7h8M2 11h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <rect x="10" y="8" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M11.5 10h1M12 9.5v1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

function ComplianceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L2 4v4c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V4L8 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PlanningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 13h12M4 10V6l4-3 4 3v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'matters', label: 'Matters', icon: <MattersIcon />, badge: 7, badgeType: 'count' },
  { id: 'research', label: 'Research Library', icon: <ResearchIcon /> },
  { id: 'analysis', label: 'AI Analysis', icon: <AnalysisIcon />, badge: 'AI', badgeType: 'ai' },
  { id: 'planning', label: 'Tax Planning', icon: <PlanningIcon /> },
  { id: 'workpapers', label: 'Workpapers', icon: <WorkpaperIcon /> },
  { id: 'compliance', label: 'Compliance & Filing', icon: <ComplianceIcon />, badge: 3, badgeType: 'alert' },
]

interface Props {
  active: NavSection
  onNavigate: (s: NavSection) => void
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside
      className="flex flex-col h-screen shrink-0 overflow-hidden"
      style={{
        width: 248,
        backgroundColor: 'var(--color-navy)',
        borderRight: '1px solid var(--color-navy-700)',
      }}
    >
      {/* Wordmark */}
      <div
        className="px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="text-base font-bold tracking-wide"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ivory)' }}
        >
          TAXAI
          <span style={{ color: 'var(--color-gold-300)' }}> MASTER</span>
        </div>
        <div className="text-xs mt-0.5 tracking-widest uppercase" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>
          Tax Research & Analysis Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="text-xs uppercase tracking-widest mb-2 px-2" style={{ color: 'var(--color-navy-300)', fontSize: 9.5 }}>
          Workspace
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-all duration-150"
                  style={{
                    fontSize: 13,
                    color: isActive ? 'var(--color-ivory)' : 'var(--color-navy-200)',
                    backgroundColor: isActive ? 'var(--color-navy-700)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--color-gold-300)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  }}
                >
                  <span className="shrink-0" style={{ opacity: isActive ? 1 : 0.65 }}>
                    {item.icon}
                  </span>
                  <span className="flex-1 font-medium" style={{ fontWeight: isActive ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: item.badgeType === 'ai'
                          ? 'rgba(91, 127, 212, 0.3)'
                          : item.badgeType === 'alert'
                          ? 'rgba(217, 112, 112, 0.3)'
                          : 'rgba(255,255,255,0.1)',
                        color: item.badgeType === 'ai'
                          ? '#8aacf0'
                          : item.badgeType === 'alert'
                          ? '#f0a0a0'
                          : 'var(--color-navy-200)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Active Matter Block */}
        <div
          className="mt-6 rounded mx-1 p-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-navy-300)', fontSize: 9.5 }}>
            Active Matter
          </div>
          <div className="text-xs font-semibold leading-tight mb-1" style={{ color: 'var(--color-ivory)', fontSize: 12 }}>
            {ACTIVE_MATTER.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-navy-200)', fontSize: 11 }}>
            {ACTIVE_MATTER.type}
          </div>
          <div
            className="text-xs mt-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold-300)', fontSize: 10 }}
          >
            {ACTIVE_MATTER.id}
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: 'var(--color-navy-600)', color: 'var(--color-gold-300)', fontFamily: 'var(--font-display)' }}
        >
          JM
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-ivory)', fontSize: 12 }}>
            James R. Morrison
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--color-navy-300)', fontSize: 10.5 }}>
            Senior Tax Counsel
          </div>
        </div>
        <button
          className="shrink-0 p-1 rounded transition-colors"
          style={{ color: 'var(--color-navy-300)' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ivory)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-navy-300)'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}
