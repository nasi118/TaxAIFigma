import { useState } from 'react'
import type { NavSection } from '../App'

const BREADCRUMBS: Record<NavSection, string[]> = {
  dashboard: ['Dashboard'],
  matters: ['Dashboard', 'All Matters'],
  research: ['Research Library'],
  analysis: ['AI Analysis', 'EST-0047 — Thornton Estate'],
  planning: ['Tax Planning & Strategies', 'EST-0047 — Scenarios'],
  workpapers: ['Workpapers', 'EST-0047 — Form 706 Computation'],
  compliance: ['Compliance & Filing', 'EST-0047 — Filing Checklist'],
}

interface Props {
  activeSection: NavSection
  onNavigate: (s: NavSection) => void
}

export default function TopBar({ activeSection, onNavigate }: Props) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const crumbs = BREADCRUMBS[activeSection]

  return (
    <header
      className="shrink-0 flex items-center gap-4"
      style={{
        height: 52,
        paddingLeft: 20,
        paddingRight: 20,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'rgba(13, 30, 53, 0.04) 0px 1px 3px 0px inset',
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--color-slate-300)' }}>
                <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span
              className="text-sm truncate"
              style={{
                fontFamily: i === crumbs.length - 1 ? 'var(--font-display)' : 'var(--font-sans)',
                fontSize: i === crumbs.length - 1 ? 13 : 12,
                color: i === crumbs.length - 1 ? 'var(--color-navy)' : 'var(--color-slate-500)',
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
                cursor: i < crumbs.length - 1 ? 'pointer' : 'default',
              }}
              onClick={() => i === 0 && onNavigate('dashboard')}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 rounded"
        style={{
          width: 280,
          height: 32,
          backgroundColor: searchFocused ? '#fff' : 'var(--color-ivory)',
          border: `1px solid ${searchFocused ? 'var(--color-navy-300)' : 'var(--color-border)'}`,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: searchFocused ? '0 0 0 3px rgba(74,122,168,0.12)' : 'none',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: 'var(--color-slate-400)', flexShrink: 0 }}>
          <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search IRC, Regs, cases, matters…"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent outline-none text-xs"
          style={{ color: 'var(--color-navy)', fontSize: 12 }}
        />
        {searchValue && (
          <button onClick={() => setSearchValue('')} style={{ color: 'var(--color-slate-400)' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <kbd
          className="text-xs rounded px-1"
          style={{ fontSize: 9, color: 'var(--color-slate-400)', backgroundColor: 'var(--color-slate-100)', fontFamily: 'var(--font-mono)' }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Version indicator */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'var(--color-status-active-bg)', color: 'var(--color-status-active)', border: '1px solid rgba(30,90,53,0.15)', fontSize: 11 }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--color-status-active)' }} />
          v2.4 — Live
        </div>

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded transition-colors"
          style={{ color: 'var(--color-slate)' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-slate-100)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5a5 5 0 00-5 5v3l-1.5 2h13L13 9.5v-3a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.25"/>
          </svg>
          <span
            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
            style={{ fontSize: 8, backgroundColor: 'var(--color-risk-high)', fontFamily: 'var(--font-mono)' }}
          >
            3
          </span>
        </button>

        {/* Help */}
        <button
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--color-slate)' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-slate-100)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M6 6.5c0-1.1.9-2 2-2s2 .9 2 2c0 .9-.6 1.6-1.5 1.9V9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
          </svg>
        </button>

        {/* Divider */}
        <div className="h-5 w-px" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* User avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: 'var(--color-navy)',
            color: 'var(--color-gold-300)',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
          }}
        >
          JM
        </div>
      </div>
    </header>
  )
}
