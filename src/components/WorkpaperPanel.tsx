import { useState } from 'react'

const SCHEDULES = [
  {
    id: 'sched-a',
    label: 'Schedule A — Real Property',
    items: [
      { desc: 'Thornton Family Residence, 84 Glenbrook Manor, Greenwich CT 06831', value: 5800000, notes: 'Appraisal pending — Cushman & Wakefield', flag: true },
      { desc: 'Vacation Property, 11 Osprey Point, Nantucket MA 02554', value: 1950000, notes: 'Appraisal pending — Bradford Real Estate', flag: true },
      { desc: 'Commercial Property, 2200 Post Rd, Fairfield CT (50% interest)', value: 700000, notes: 'Discount for fractional interest — 15% applied per IRC § 2703', flag: false },
    ],
    total: 8450000,
  },
  {
    id: 'sched-b',
    label: 'Schedule B — Stocks & Bonds',
    items: [
      { desc: 'Vanguard Total Stock Market ETF (VTI) — 42,300 shares @ $246.18', value: 10413414, notes: 'DOD closing price — NYSE', flag: false },
      { desc: 'US Treasury Notes, 4.75% due 2026 — $500,000 face', value: 513400, notes: 'Plus accrued interest $14,230 — Bloomberg', flag: false },
      { desc: 'Blackwood Growth Partners LP (LP interest — 8.4%)', value: 273186, notes: 'Per K-1; qualified appraisal required for audit protection', flag: false },
    ],
    total: 11200000,
  },
  {
    id: 'sched-c',
    label: 'Schedule C — Mortgages, Notes & Cash',
    items: [
      { desc: 'Morgan Stanley Checking & Money Market', value: 892400, notes: 'DOD balance per account statement', flag: false },
      { desc: 'Note Receivable — Thornton Jr. (§ 7872 AFR Note)', value: 750000, notes: 'Original principal; $8,200 accrued interest', flag: false },
      { desc: 'Cash in Nantucket property safe (estimated)', value: 12000, notes: 'Estimated — to be confirmed by executor', flag: true },
      { desc: 'Refund — 2023 CT Income Tax', value: 195600, notes: 'Per CT DRS — confirmed via return', flag: false },
    ],
    total: 1850000,
  },
]

const TAX_COMPUTATION = [
  { line: '1', label: 'Total Gross Estate (Schedules A–I)', value: 24700000, indent: 0, subtotal: false },
  { line: '2', label: 'Deductible expenses, indebtedness, taxes', value: -485000, indent: 1, subtotal: false },
  { line: '3', label: 'Adjusted Gross Estate', value: 24215000, indent: 0, subtotal: true },
  { line: '4a', label: 'Marital Deduction (partial QTIP — formula fraction)', value: -9800000, indent: 1, subtotal: false },
  { line: '4b', label: 'Charitable Deduction (Clause 4 bequest — § 2055)', value: -500000, indent: 1, subtotal: false },
  { line: '5', label: 'Taxable Estate', value: 13915000, indent: 0, subtotal: true },
  { line: '6', label: 'Adjusted Taxable Gifts (post-1976)', value: 0, indent: 1, subtotal: false },
  { line: '7', label: 'Add Lines 5 and 6', value: 13915000, indent: 0, subtotal: false },
  { line: '8', label: 'Tentative Tax (§ 2001(c) rate schedule)', value: 5511800, indent: 1, subtotal: false },
  { line: '9', label: 'Less: Gift taxes paid on post-1976 gifts', value: 0, indent: 1, subtotal: false },
  { line: '10', label: 'Gross Estate Tax', value: 5511800, indent: 0, subtotal: false },
  { line: '11', label: 'Less: Unified Credit (§ 2010 — 2024 exclusion $13,610,000)', value: -5389800, indent: 1, subtotal: false },
  { line: '12', label: 'Net Estate Tax Before Other Credits', value: 122000, indent: 0, subtotal: true },
  { line: '13', label: 'Other credits (§ 2011, 2013, 2014)', value: 0, indent: 1, subtotal: false },
  { line: '14', label: 'Net Federal Estate Tax Due', value: 122000, indent: 0, subtotal: true },
]

const SCENARIOS = [
  {
    id: 'current',
    label: 'Current Law (2024)',
    qtip: 9800000,
    charitable: 500000,
    exemption: 13610000,
    taxableEstate: 13915000,
    netTax: 122000,
    dsue: 0,
    note: 'Minimal tax; portability election preserves DSUE',
    risk: 'low',
  },
  {
    id: 'sunset',
    label: 'Post-TCJA Sunset (2026+)',
    qtip: 9800000,
    charitable: 500000,
    exemption: 7000000,
    taxableEstate: 13915000,
    netTax: 2766000,
    dsue: 0,
    note: 'Est. $7M exemption; significant tax exposure on existing plan',
    risk: 'high',
  },
  {
    id: 'optimized',
    label: 'Optimized — Max Credit Shelter',
    qtip: 14215000,
    charitable: 500000,
    exemption: 13610000,
    taxableEstate: 0,
    netTax: 0,
    dsue: 0,
    note: 'QTIP increased to eliminate all estate tax; full credit shelter',
    risk: 'low',
  },
  {
    id: 'sunset-opt',
    label: 'Sunset — With Pre-2026 Planning',
    qtip: 9800000,
    charitable: 500000,
    exemption: 13610000,
    taxableEstate: 13915000,
    netTax: 122000,
    dsue: 6710000,
    note: 'SLAT/gift planning maximizes pre-sunset exclusion; DSUE available',
    risk: 'med',
  },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Math.abs(n))
}

export default function WorkpaperPanel() {
  const [activeTab, setActiveTab] = useState<'computation' | 'schedules' | 'scenarios' | 'assumptions'>('computation')
  const [expandedSched, setExpandedSched] = useState<Set<string>>(new Set(['sched-a']))

  const toggleSched = (id: string) => {
    setExpandedSched(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1
            className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-navy)' }}
          >
            Form 706 Computation Workpaper
          </h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-slate-500)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>EST-0047-WP-001</span>
            <span>·</span>
            <span>Estate of Harold W. Thornton III</span>
            <span>·</span>
            <span>DOD: January 18, 2024</span>
            <span>·</span>
            <span
              className="px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--color-risk-med-bg)', color: 'var(--color-risk-med)', border: '1px solid var(--color-risk-med-border)', fontSize: 10 }}
            >
              Draft — v3
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-3 py-1.5 rounded"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-slate)', fontSize: 11 }}
          >
            Export PDF
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-ivory)', fontSize: 11 }}
          >
            Send for Review
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {(['computation', 'schedules', 'scenarios', 'assumptions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-xs font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? 'var(--color-navy)' : 'var(--color-slate-500)',
              borderBottom: activeTab === tab ? '2px solid var(--color-navy)' : '2px solid transparent',
              marginBottom: -1,
              fontSize: 12,
            }}
          >
            {tab === 'computation' ? 'Tax Computation' : tab === 'schedules' ? 'Asset Schedules' : tab === 'scenarios' ? 'Scenario Analysis' : 'Assumptions'}
          </button>
        ))}
      </div>

      {activeTab === 'computation' && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ backgroundColor: 'var(--color-navy)', borderBottom: '1px solid var(--color-navy-700)' }}
          >
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ivory)', fontSize: 13, fontWeight: 600 }}>
              Part 2 — Federal Estate Tax Computation
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy-200)', fontSize: 11 }}>
              IRC § 2001 | Form 706 (Rev. August 2023)
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-ivory-100)', borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-widest w-12" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Line</th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Description</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-widest w-36" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {TAX_COMPUTATION.map((row, i) => (
                <tr
                  key={row.line}
                  style={{
                    backgroundColor: row.subtotal ? 'var(--color-ivory-100)' : 'transparent',
                    borderBottom: i < TAX_COMPUTATION.length - 1 ? '1px solid var(--color-border)' : 'none',
                    borderTop: row.subtotal ? '1px solid var(--color-border-dark)' : 'none',
                  }}
                >
                  <td
                    className="px-5 py-2.5 align-top"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: 11 }}
                  >
                    {row.line}
                  </td>
                  <td
                    className="px-2 py-2.5 align-top"
                    style={{
                      paddingLeft: `${(row.indent * 20) + 8}px`,
                      color: row.subtotal ? 'var(--color-navy)' : 'var(--color-slate-600)',
                      fontSize: 12.5,
                      fontWeight: row.subtotal ? 600 : 400,
                    }}
                  >
                    {row.label}
                  </td>
                  <td
                    className="px-5 py-2.5 text-right align-top"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12.5,
                      color: row.value < 0
                        ? 'var(--color-status-active)'
                        : row.subtotal
                        ? 'var(--color-navy)'
                        : 'var(--color-slate-600)',
                      fontWeight: row.subtotal ? 700 : 400,
                    }}
                  >
                    {row.value < 0 ? `(${fmt(row.value)})` : row.value === 0 ? '—' : fmt(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            className="px-5 py-3"
            style={{ backgroundColor: 'var(--color-navy)', borderTop: '2px solid var(--color-navy-700)' }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ivory)', fontSize: 13, fontWeight: 600 }}>
                Net Federal Estate Tax Due
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold-300)', fontSize: 16, fontWeight: 700 }}>
                $122,000
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-navy-200)', fontSize: 11 }}>
              Due by October 14, 2024 (9 months from DOD) — 6-month extension available via Form 4768
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-3">
          {SCHEDULES.map((sched) => {
            const isExp = expandedSched.has(sched.id)
            return (
              <div
                key={sched.id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-3"
                  onClick={() => toggleSched(sched.id)}
                  style={{ borderBottom: isExp ? '1px solid var(--color-border)' : 'none' }}
                >
                  <span
                    className="font-semibold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 13 }}
                  >
                    {sched.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 13, fontWeight: 600 }}>
                      {fmt(sched.total)}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--color-slate-400)', transform: isExp ? 'rotate(180deg)' : 'none' }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
                {isExp && (
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-ivory-100)', borderBottom: '1px solid var(--color-border)' }}>
                        <th className="px-5 py-2 text-left text-xs uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Description</th>
                        <th className="px-5 py-2 text-left text-xs uppercase tracking-widest w-56" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Notes</th>
                        <th className="px-5 py-2 text-right text-xs uppercase tracking-widest w-36" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>DOD Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sched.items.map((item, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: i < sched.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                            backgroundColor: item.flag ? 'var(--color-risk-med-bg)' : 'transparent',
                          }}
                        >
                          <td className="px-5 py-3" style={{ fontSize: 12.5, color: 'var(--color-navy)' }}>
                            {item.flag && (
                              <span className="text-xs mr-1.5" style={{ color: 'var(--color-risk-med)' }}>⚑</span>
                            )}
                            {item.desc}
                          </td>
                          <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-slate-500)', fontSize: 11 }}>{item.notes}</td>
                          <td
                            className="px-5 py-3 text-right"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--color-navy)' }}
                          >
                            {fmt(item.value)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: 'var(--color-ivory-100)', borderTop: '1px solid var(--color-border-dark)' }}>
                        <td className="px-5 py-2.5 font-semibold text-sm" style={{ color: 'var(--color-navy)', fontSize: 12.5 }}>
                          Schedule Total
                        </td>
                        <td />
                        <td
                          className="px-5 py-2.5 text-right font-bold"
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 13 }}
                        >
                          {fmt(sched.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
          <div
            className="rounded p-3 text-xs"
            style={{ backgroundColor: 'var(--color-risk-med-bg)', border: '1px solid var(--color-risk-med-border)', color: 'var(--color-risk-med)', fontSize: 11 }}
          >
            ⚑ Items flagged in amber require certified appraisals or further documentation before filing. Schedule A real property values are preliminary.
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <div>
          <div className="text-sm mb-4" style={{ color: 'var(--color-slate-600)', fontSize: 13 }}>
            Scenario analysis showing estate tax exposure under current law, TCJA sunset, and planning alternatives.
          </div>
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-navy)', borderBottom: '1px solid var(--color-navy-700)' }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>Scenario</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>QTIP Election</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>Exemption</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>Taxable Estate</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>Net Tax Due</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: i < SCENARIOS.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: s.id === 'current' ? 'var(--color-ivory-100)' : 'transparent',
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-navy)', fontSize: 12.5 }}>{s.label}</div>
                      {s.id === 'current' && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-navy-50)', color: 'var(--color-navy-400)', fontSize: 9.5 }}>
                          Proposed filing position
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-slate-600)' }}>
                      {fmt(s.qtip)}
                    </td>
                    <td className="px-5 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-slate-600)' }}>
                      {fmt(s.exemption)}
                    </td>
                    <td className="px-5 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-slate-600)' }}>
                      {s.taxableEstate === 0 ? '—' : fmt(s.taxableEstate)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="font-bold"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          color: s.risk === 'high'
                            ? 'var(--color-risk-high)'
                            : s.risk === 'med'
                            ? 'var(--color-risk-med)'
                            : s.netTax === 0 ? 'var(--color-status-active)' : 'var(--color-navy)',
                        }}
                      >
                        {s.netTax === 0 ? '$0' : fmt(s.netTax)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-slate-600)', fontSize: 11 }}>
                      {s.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="mt-3 rounded p-3 text-xs"
            style={{ backgroundColor: 'var(--color-ai-bg)', border: '1px solid rgba(91,127,212,0.25)', color: 'var(--color-ai-text)', fontSize: 11 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>AI Note:</span>{' '}
            Post-sunset exemption of $7M is estimated based on 2010 EGTRRA baseline indexed for inflation. Actual amount subject to Treasury guidance. Anti-clawback regulations (T.D. 9884) may protect pre-sunset gifts. Scenario analysis does not constitute tax advice.
          </div>
        </div>
      )}

      {activeTab === 'assumptions' && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="px-5 py-3" style={{ backgroundColor: 'var(--color-ivory-100)', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
              Workpaper Assumptions & References
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-ivory-100)' }}>
                <th className="px-5 py-2 text-left text-xs uppercase tracking-widest w-64" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Parameter</th>
                <th className="px-5 py-2 text-left text-xs uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Value / Authority</th>
                <th className="px-5 py-2 text-left text-xs uppercase tracking-widest w-40" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { param: 'Date of Death', value: 'January 18, 2024', status: 'Confirmed' },
                { param: '2024 Applicable Exclusion Amount', value: '$13,610,000 — Rev. Proc. 2023-34', status: 'Confirmed' },
                { param: '2024 Annual Gift Exclusion', value: '$18,000 per donee — Rev. Proc. 2023-34', status: 'Confirmed' },
                { param: 'Unified Credit (2024)', value: '$5,389,800 — computed from § 2010(c)', status: 'Confirmed' },
                { param: 'Form 706 Filing Deadline', value: 'October 14, 2024 (9 months from DOD)', status: 'Confirmed' },
                { param: 'Extension Deadline (Form 4768)', value: 'April 14, 2025 (6-month extension)', status: 'Pending client decision' },
                { param: 'NY Estate Tax Threshold (2024)', value: '$6,940,000 — NY Tax Law § 952', status: 'Confirmed — separate memo required' },
                { param: 'Schedule A Appraisals', value: 'Cushman & Wakefield / Bradford RE — due Aug 30', status: 'PENDING' },
                { param: 'Charitable Deduction — § 501(c)(3) Status', value: 'Thornton Family Foundation — EIN 23-1447832', status: 'Verification in progress' },
                { param: 'Adjusted Taxable Gifts', value: '$0 — no prior Form 709 gifts identified', status: 'Confirmed — review 3-year gift history' },
              ].map((row, i, arr) => (
                <tr
                  key={row.param}
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--color-navy)', fontSize: 12.5 }}>{row.param}</td>
                  <td className="px-5 py-2.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-600)', fontSize: 11.5 }}>{row.value}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        fontSize: 10,
                        backgroundColor: row.status === 'Confirmed' ? 'var(--color-status-active-bg)' : row.status === 'PENDING' ? 'var(--color-risk-high-bg)' : 'var(--color-risk-med-bg)',
                        color: row.status === 'Confirmed' ? 'var(--color-status-active)' : row.status === 'PENDING' ? 'var(--color-risk-high)' : 'var(--color-risk-med)',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
