import type { NavSection } from '../App'

const STATS = [
  { label: 'Active Matters', value: '7', sub: '2 added this quarter', color: 'var(--color-navy)' },
  { label: 'Open Action Items', value: '24', sub: '6 due this week', color: 'var(--color-risk-med)' },
  { label: 'Pending Deadlines', value: '9', sub: 'Next: Sept 15, 2024', color: 'var(--color-risk-high)' },
  { label: 'Research Sources', value: '1,482', sub: 'IRC, Regs, Cases, IRS', color: 'var(--color-status-active)' },
]

const MATTERS = [
  {
    id: '2024-EST-0047',
    name: 'Estate of Harold W. Thornton III',
    type: 'Estate Tax — Form 706',
    status: 'active',
    risk: 'med',
    entity: 'Individual',
    grossEstate: '$24.7M',
    partner: 'Morrison',
    due: 'Oct 14, 2024',
    issues: 3,
    flag: 'QTIP election timing',
  },
  {
    id: '2024-PRTNR-0039',
    name: 'GreenField Capital LLC',
    type: 'Partnership Restructuring — §754/743',
    status: 'review',
    risk: 'high',
    entity: 'Partnership',
    grossEstate: '—',
    partner: 'Vasquez',
    due: 'Aug 30, 2024',
    issues: 5,
    flag: '§743(b) basis adjustment exposure',
  },
  {
    id: '2024-INTL-0052',
    name: 'Meridian Pharmaceuticals, Inc.',
    type: 'Transfer Pricing — IRC §482',
    status: 'active',
    risk: 'high',
    entity: 'C-Corp',
    grossEstate: '—',
    partner: 'Chen',
    due: 'Dec 31, 2024',
    issues: 7,
    flag: 'APA filing deadline 90 days',
  },
  {
    id: '2024-INTL-0044',
    name: 'Sarah & Wei Chen Family Office',
    type: 'International — FBAR / FATCA / §965',
    status: 'active',
    risk: 'low',
    entity: 'Individual / Trust',
    grossEstate: '—',
    partner: 'Morrison',
    due: 'Oct 15, 2024',
    issues: 2,
    flag: null,
  },
  {
    id: '2024-GST-0031',
    name: 'Blackwood Family Dynasty Trust',
    type: 'GST / Gift Planning — §§2601, 2631',
    status: 'draft',
    risk: 'low',
    entity: 'Trust',
    grossEstate: '—',
    partner: 'Vasquez',
    due: 'Ongoing',
    issues: 1,
    flag: null,
  },
  {
    id: '2024-REIT-0058',
    name: 'Northgate REIT Holdings, LLC',
    type: 'UPREIT Conversion — §§1031, 721',
    status: 'active',
    risk: 'med',
    entity: 'Partnership / REIT',
    grossEstate: '—',
    partner: 'Chen',
    due: 'Nov 30, 2024',
    issues: 4,
    flag: 'Boot recognition risk',
  },
  {
    id: '2024-PF-0021',
    name: 'Caldwell Family Foundation',
    type: 'Private Foundation — §§4940–4942',
    status: 'done',
    risk: 'low',
    entity: 'Foundation',
    grossEstate: '—',
    partner: 'Morrison',
    due: 'Filed 05/15/24',
    issues: 0,
    flag: null,
  },
]

const ACTIVITY = [
  { time: '2h ago', user: 'E. Vasquez', action: 'Updated QTIP analysis memo', matter: 'EST-0047', type: 'update' },
  { time: '4h ago', user: 'AI Assistant', action: 'Generated §482 transfer pricing draft', matter: 'INTL-0052', type: 'ai' },
  { time: '6h ago', user: 'J. Morrison', action: 'Uploaded Form 706 draft v3', matter: 'EST-0047', type: 'upload' },
  { time: '1d ago', user: 'System', action: 'Deadline reminder: GreenField filing', matter: 'PRTNR-0039', type: 'alert' },
  { time: '1d ago', user: 'K. Huang', action: 'Added PLR 202234012 to research library', matter: 'EST-0047', type: 'research' },
  { time: '2d ago', user: 'J. Morrison', action: 'Completed portability election analysis', matter: 'GST-0031', type: 'done' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:  { bg: 'var(--color-status-active-bg)',  text: 'var(--color-status-active)',  label: 'Active' },
  review:  { bg: 'var(--color-status-review-bg)', text: 'var(--color-status-review)', label: 'Under Review' },
  draft:   { bg: 'var(--color-status-draft-bg)',  text: 'var(--color-status-draft)',  label: 'Draft' },
  done:    { bg: 'var(--color-status-done-bg)',   text: 'var(--color-status-done)',   label: 'Completed' },
}

const RISK_STYLES: Record<string, { color: string; label: string }> = {
  high: { color: 'var(--color-risk-high)',  label: '● High' },
  med:  { color: 'var(--color-risk-med)',   label: '◐ Med' },
  low:  { color: 'var(--color-status-active)', label: '○ Low' },
}

const ACTIVITY_COLORS: Record<string, string> = {
  update: 'var(--color-navy-400)',
  ai: 'var(--color-ai-border)',
  upload: 'var(--color-status-active)',
  alert: 'var(--color-risk-high)',
  research: 'var(--color-gold)',
  done: 'var(--color-status-active)',
}

interface Props {
  onNavigate: (s: NavSection) => void
}

export default function Dashboard({ onNavigate }: Props) {
  return (
    <div
      className="max-w-[1400px]"
      style={{
        padding: 20,
        backgroundColor: '#ffffff',
        border: '1px solid #000000',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 4px 0px',
      }}
    >

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-slate-400)', fontSize: 10 }}>
              {stat.label}
            </div>
            <div
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-slate-500)', fontSize: 11 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Matters Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-navy)' }}
            >
              Active Matters
            </h2>
            <div className="flex items-center gap-2">
              <button
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{ color: 'var(--color-slate)', border: '1px solid var(--color-border)', fontSize: 11 }}
              >
                Filter
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-ivory)', fontSize: 11 }}
                onClick={() => onNavigate('matters')}
              >
                + New Matter
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-ivory-100)', borderBottom: '1px solid var(--color-border)' }}>
                {['Matter / Type', 'Status', 'Risk', 'Partner', 'Due Date', 'Open Issues', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATTERS.map((m, i) => {
                const ss = STATUS_STYLES[m.status]
                const rs = RISK_STYLES[m.risk]
                return (
                  <tr
                    key={m.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: i < MATTERS.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-ivory-100)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                    onClick={() => onNavigate('analysis')}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm" style={{ color: 'var(--color-navy)', fontSize: 13 }}>
                        {m.name}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--color-slate-500)', fontSize: 11 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: 10 }}>{m.id}</span>
                        <span>·</span>
                        <span>{m.type}</span>
                      </div>
                      {m.flag && (
                        <div
                          className="text-xs mt-1 px-1.5 py-0.5 rounded inline-block"
                          style={{
                            fontSize: 10,
                            backgroundColor: 'var(--color-risk-med-bg)',
                            color: 'var(--color-risk-med)',
                            border: '1px solid var(--color-risk-med-border)',
                          }}
                        >
                          ⚑ {m.flag}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: ss.bg, color: ss.text, fontSize: 11 }}
                      >
                        {ss.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{ color: rs.color, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {rs.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-slate-600)', fontSize: 12 }}>
                      {m.partner}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-600)', fontSize: 11 }}>
                      {m.due}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.issues > 0 ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{
                            backgroundColor: m.issues > 4 ? 'var(--color-risk-high-bg)' : 'var(--color-risk-med-bg)',
                            color: m.issues > 4 ? 'var(--color-risk-high)' : 'var(--color-risk-med)',
                            fontSize: 11,
                          }}
                        >
                          {m.issues}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-slate-300)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ color: 'var(--color-navy-400)', fontSize: 11 }}
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Activity Feed */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-navy)' }}
            >
              Recent Activity
            </h2>
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {ACTIVITY.map((a, i) => (
              <li key={i} className="px-4 py-3 flex gap-3">
                <div
                  className="w-1.5 rounded-full shrink-0 mt-1"
                  style={{ height: 'calc(100% - 8px)', backgroundColor: ACTIVITY_COLORS[a.type], minHeight: 28, opacity: 0.7 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium" style={{ color: 'var(--color-navy)', fontSize: 12 }}>
                    {a.action}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--color-slate-500)', fontSize: 10.5 }}>
                      {a.user}
                    </span>
                    <span style={{ color: 'var(--color-slate-300)' }}>·</span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: 10 }}
                    >
                      {a.matter}
                    </span>
                    <span style={{ color: 'var(--color-slate-300)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--color-slate-400)', fontSize: 10 }}>
                      {a.time}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div
            className="px-4 py-3"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <button
              className="text-xs w-full text-center py-1 rounded transition-colors"
              style={{ color: 'var(--color-navy-400)', fontSize: 11 }}
            >
              View full audit trail →
            </button>
          </div>
        </div>
      </div>

      {/* Risk Flags Row */}
      <div
        className="mt-4 rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <h2
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-navy)' }}
          >
            Risk & Deadline Flags
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--color-risk-high-bg)', color: 'var(--color-risk-high)', fontSize: 11 }}
          >
            3 high priority
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              type: 'deadline',
              matter: 'EST-0047 — Thornton Estate',
              flag: 'Form 706 filing deadline',
              detail: 'Due Oct 14, 2024. Extension available via Form 4768. Auto-portability election risks forfeiture if unfiled.',
              risk: 'high',
            },
            {
              type: 'analysis',
              matter: 'PRTNR-0039 — GreenField Capital',
              flag: '§743(b) basis adjustment — unreported partnership items',
              detail: 'Substantial understatement penalty exposure under §6662(d). Recommend amended Schedules K-1 for tax years 2021–2023.',
              risk: 'high',
            },
            {
              type: 'sunset',
              matter: 'EST-0047 / GST-0031 — Multiple Matters',
              flag: 'TCJA Sunset — §2010 exemption cliff',
              detail: 'Current $13.61M exemption reverts to ~$7M post-2025. Recommend accelerated gifting or SLAT strategies for both matters.',
              risk: 'high',
            },
          ].map((flag, i) => (
            <div
              key={i}
              className="rounded-md p-3"
              style={{
                border: `1px solid var(--color-risk-high-border)`,
                backgroundColor: 'var(--color-risk-high-bg)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="text-xs font-bold" style={{ color: 'var(--color-risk-high)', fontSize: 11.5 }}>
                  ⚑ {flag.flag}
                </div>
                <span
                  className="shrink-0 text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--color-risk-high)', color: '#fff', fontSize: 9.5, fontFamily: 'var(--font-mono)' }}
                >
                  HIGH
                </span>
              </div>
              <div className="text-xs mb-1.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-500)', fontSize: 10 }}>
                {flag.matter}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--color-slate-600)', fontSize: 11 }}>
                {flag.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
