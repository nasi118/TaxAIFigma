import { useState } from 'react'

type CheckStatus = 'done' | 'pending' | 'blocked' | 'na'

interface CheckItem {
  id: string
  section: string
  task: string
  assignee: string
  due: string
  status: CheckStatus
  priority: 'high' | 'med' | 'low'
  note?: string
  authority?: string
}

const CHECKLIST: CheckItem[] = [
  // Filing Preparation
  { id: 'c1', section: 'Filing Preparation', task: 'Obtain certified date-of-death valuations — Schedule A real property', assignee: 'E. Vasquez', due: 'Aug 30, 2024', status: 'pending', priority: 'high', note: 'Cushman & Wakefield and Bradford RE engaged', authority: 'Treas. Reg. § 20.2031-1' },
  { id: 'c2', section: 'Filing Preparation', task: 'Confirm Schedule B securities valuations (DOD closing prices)', assignee: 'K. Huang', due: 'Aug 15, 2024', status: 'done', priority: 'med', authority: 'Treas. Reg. § 20.2031-2' },
  { id: 'c3', section: 'Filing Preparation', task: 'Obtain executor letters testamentary and EIN for estate', assignee: 'J. Morrison', due: 'Completed', status: 'done', priority: 'high' },
  { id: 'c4', section: 'Filing Preparation', task: 'Verify § 501(c)(3) status of Thornton Family Foundation (charitable deduction)', assignee: 'K. Huang', due: 'Aug 20, 2024', status: 'pending', priority: 'med', authority: 'I.R.C. § 2055' },
  { id: 'c5', section: 'Filing Preparation', task: 'Compile 3-year gift history — confirm no prior Form 709 taxable gifts', assignee: 'E. Vasquez', due: 'Aug 18, 2024', status: 'done', priority: 'med', authority: 'I.R.C. § 2001(b)' },

  // QTIP Election
  { id: 'c6', section: 'QTIP Election', task: 'Confirm trust instrument satisfies § 2056(b)(7)(B)(ii) income interest requirement', assignee: 'J. Morrison', due: 'Sep 1, 2024', status: 'pending', priority: 'high', authority: 'I.R.C. § 2056(b)(7); Treas. Reg. § 20.2056(b)-7' },
  { id: 'c7', section: 'QTIP Election', task: 'Draft formula fractional QTIP election statement', assignee: 'E. Vasquez', due: 'Sep 15, 2024', status: 'pending', priority: 'high', note: 'Reference PLR 202234012; attach as statement to Form 706', authority: 'PLR 202234012; Rev. Rul. 79-397' },
  { id: 'c8', section: 'QTIP Election', task: 'Client meeting — confirm credit shelter funding decision', assignee: 'J. Morrison', due: 'Sep 1, 2024', status: 'pending', priority: 'high', note: 'Pre-requisite for final QTIP fraction calculation' },
  { id: 'c9', section: 'QTIP Election', task: 'Review Clayton distinction for protective disclosure statement', assignee: 'J. Morrison', due: 'Sep 15, 2024', status: 'pending', priority: 'med', authority: 'Estate of Clayton v. Commissioner, 97 T.C. 327' },

  // Form 706 Filing
  { id: 'c10', section: 'Form 706 Filing', task: 'Complete Schedule A-1 (section 2032A special-use valuation) — determine inapplicable', assignee: 'E. Vasquez', due: 'Sep 20, 2024', status: 'done', priority: 'low' },
  { id: 'c11', section: 'Form 706 Filing', task: 'Complete Schedule E — jointly owned Nantucket property ($2.7M)', assignee: 'K. Huang', due: 'Sep 5, 2024', status: 'pending', priority: 'med', authority: 'I.R.C. § 2040' },
  { id: 'c12', section: 'Form 706 Filing', task: 'Prepare Part 4 — General Information (beneficiary designations, FEIN)', assignee: 'K. Huang', due: 'Sep 15, 2024', status: 'done', priority: 'low' },
  { id: 'c13', section: 'Form 706 Filing', task: 'Finalize Form 706 — executor signature and jurat', assignee: 'J. Morrison', due: 'Oct 1, 2024', status: 'pending', priority: 'high' },
  { id: 'c14', section: 'Form 706 Filing', task: 'File Form 706 with IRS Cincinnati SC — or file Form 4768 extension', assignee: 'J. Morrison', due: 'Oct 14, 2024', status: 'pending', priority: 'high', note: 'STATUTORY DEADLINE — 9 months from DOD', authority: 'I.R.C. § 6075(a)' },

  // Portability
  { id: 'c15', section: 'Portability Election', task: 'Confirm portability election decision with client (preserve DSUE)', assignee: 'J. Morrison', due: 'Sep 1, 2024', status: 'pending', priority: 'high', authority: 'I.R.C. § 2010(c); Treas. Reg. § 20.2010-2' },
  { id: 'c16', section: 'Portability Election', task: 'Compute DSUE amount for surviving spouse', assignee: 'E. Vasquez', due: 'Sep 20, 2024', status: 'pending', priority: 'med' },

  // Basis Reporting
  { id: 'c17', section: 'Basis Reporting', task: 'File Form 8971 (consistent basis reporting) — due 30 days after Form 706', assignee: 'K. Huang', due: 'Nov 13, 2024', status: 'pending', priority: 'high', note: 'Penalty $250/statement; no extension available', authority: 'I.R.C. § 6035; Treas. Reg. § 1.6035-1' },
  { id: 'c18', section: 'Basis Reporting', task: 'Provide Schedule A (beneficiary statements) to each beneficiary', assignee: 'K. Huang', due: 'Nov 13, 2024', status: 'pending', priority: 'high', authority: 'I.R.C. § 6035(a)(2)' },

  // State Tax
  { id: 'c19', section: 'State Tax — New York', task: 'Prepare NY estate tax return (ET-706) — threshold $6.94M', assignee: 'E. Vasquez', due: 'Oct 14, 2024', status: 'pending', priority: 'high', note: 'NY gross estate ($24.7M) exceeds threshold by large margin; separate analysis required', authority: 'NY Tax Law §§ 952, 960' },
  { id: 'c20', section: 'State Tax — New York', task: 'Analyze NY QTIP election — separate election required (not automatic)', assignee: 'J. Morrison', due: 'Sep 15, 2024', status: 'pending', priority: 'high', note: 'NY does not conform to federal QTIP election automatically', authority: 'NY Tax Law § 955(b)' },
  { id: 'c21', section: 'State Tax — New York', task: 'Confirm CT situs property — evaluate CT estate tax exposure', assignee: 'K. Huang', due: 'Sep 10, 2024', status: 'pending', priority: 'med', authority: 'CT Gen. Stat. § 12-391' },

  // Post-Filing
  { id: 'c22', section: 'Post-Filing Planning', task: 'Advise surviving spouse on SLAT / GRAT planning before 12/31/2025 (TCJA sunset)', assignee: 'J. Morrison', due: 'Q4 2024', status: 'pending', priority: 'high', note: 'Critical planning window — exemption cliff risk', authority: 'I.R.C. § 2702; T.D. 9884' },
  { id: 'c23', section: 'Post-Filing Planning', task: 'Schedule § 2044 planning consultation for surviving spouse\'s estate', assignee: 'J. Morrison', due: 'Q1 2025', status: 'pending', priority: 'med', authority: 'I.R.C. § 2044' },
]

const STATUS_DISPLAY: Record<CheckStatus, { label: string; color: string; bg: string; icon: string }> = {
  done:    { label: 'Complete', color: 'var(--color-status-active)', bg: 'var(--color-status-active-bg)', icon: '✓' },
  pending: { label: 'Pending',  color: 'var(--color-risk-med)',      bg: 'var(--color-risk-med-bg)',      icon: '○' },
  blocked: { label: 'Blocked',  color: 'var(--color-risk-high)',     bg: 'var(--color-risk-high-bg)',     icon: '⊘' },
  na:      { label: 'N/A',      color: 'var(--color-slate-400)',     bg: 'var(--color-slate-50)',         icon: '—' },
}

const SECTIONS = [...new Set(CHECKLIST.map(c => c.section))]

const DEADLINES = [
  { date: 'Aug 15', task: 'Securities valuations confirmed', matter: 'EST-0047', done: true },
  { date: 'Aug 18', task: 'Prior gift history compiled', matter: 'EST-0047', done: true },
  { date: 'Aug 20', task: 'Foundation § 501(c)(3) verified', matter: 'EST-0047', done: false },
  { date: 'Aug 30', task: 'Real property appraisals due', matter: 'EST-0047', done: false },
  { date: 'Sep 1',  task: 'Client meeting — credit shelter decision', matter: 'EST-0047', done: false },
  { date: 'Sep 15', task: 'QTIP election statement drafted', matter: 'EST-0047', done: false },
  { date: 'Sep 20', task: 'DSUE computation completed', matter: 'EST-0047', done: false },
  { date: 'Oct 1',  task: 'Form 706 finalized for signature', matter: 'EST-0047', done: false },
  { date: 'Oct 14', task: 'FORM 706 FILING DEADLINE', matter: 'EST-0047', done: false, critical: true },
  { date: 'Nov 13', task: 'Form 8971 filing deadline', matter: 'EST-0047', done: false, critical: true },
]

export default function CompliancePanel() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(CHECKLIST.filter(c => c.status === 'done').map(c => c.id))
  )
  const [activeTab, setActiveTab] = useState<'checklist' | 'timeline' | 'filings'>('checklist')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(SECTIONS))
  const [filterSection, setFilterSection] = useState<string>('all')

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleSection = (s: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(s)) { next.delete(s) } else { next.add(s) }
      return next
    })
  }

  const totalItems = CHECKLIST.length
  const doneItems = checkedItems.size
  const pct = Math.round((doneItems / totalItems) * 100)

  const filteredChecklist = filterSection === 'all'
    ? CHECKLIST
    : CHECKLIST.filter(c => c.section === filterSection)

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1
            className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-navy)' }}
          >
            Compliance & Filing Checklist
          </h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-slate-500)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>EST-0047</span>
            <span>·</span>
            <span>Estate of Harold W. Thornton III</span>
            <span>·</span>
            <span>Form 706 — Due Oct 14, 2024</span>
          </div>
        </div>
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: pct > 70 ? 'var(--color-status-active)' : pct > 40 ? 'var(--color-risk-med)' : 'var(--color-risk-high)' }}
            >
              {pct}%
            </div>
            <div className="text-xs" style={{ color: 'var(--color-slate-400)', fontSize: 10 }}>Complete</div>
          </div>
          <div>
            <div
              className="w-32 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-slate-100)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct > 70 ? 'var(--color-status-active)' : pct > 40 ? 'var(--color-gold)' : 'var(--color-risk-high)',
                }}
              />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-slate-400)', fontSize: 10 }}>
              {doneItems} / {totalItems} items
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {(['checklist', 'timeline', 'filings'] as const).map(tab => (
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
            {tab === 'checklist' ? `Checklist (${totalItems})` : tab === 'timeline' ? 'Deadline Timeline' : 'Required Filings'}
          </button>
        ))}
      </div>

      {activeTab === 'checklist' && (
        <div>
          {/* Section Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilterSection('all')}
              className="text-xs px-3 py-1 rounded transition-all"
              style={{
                backgroundColor: filterSection === 'all' ? 'var(--color-navy)' : 'var(--color-card)',
                color: filterSection === 'all' ? 'var(--color-ivory)' : 'var(--color-slate)',
                border: '1px solid var(--color-border)',
                fontSize: 11,
              }}
            >
              All Sections
            </button>
            {SECTIONS.map(s => (
              <button
                key={s}
                onClick={() => setFilterSection(s === filterSection ? 'all' : s)}
                className="text-xs px-3 py-1 rounded transition-all"
                style={{
                  backgroundColor: filterSection === s ? 'var(--color-navy-50)' : 'var(--color-card)',
                  color: filterSection === s ? 'var(--color-navy)' : 'var(--color-slate)',
                  border: `1px solid ${filterSection === s ? 'var(--color-navy-200)' : 'var(--color-border)'}`,
                  fontSize: 11,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Checklist by Section */}
          <div className="space-y-3">
            {[...new Set(filteredChecklist.map(c => c.section))].map(section => {
              const items = filteredChecklist.filter(c => c.section === section)
              const isExp = expandedSections.has(section)
              const doneCount = items.filter(i => checkedItems.has(i.id)).length

              return (
                <div
                  key={section}
                  className="rounded-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                >
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3"
                    style={{ borderBottom: isExp ? '1px solid var(--color-border)' : 'none' }}
                    onClick={() => toggleSection(section)}
                  >
                    <span
                      className="font-semibold flex-1 text-left"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 13 }}
                    >
                      {section}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: doneCount === items.length ? 'var(--color-status-active-bg)' : 'var(--color-slate-100)',
                        color: doneCount === items.length ? 'var(--color-status-active)' : 'var(--color-slate)',
                        fontSize: 10.5,
                      }}
                    >
                      {doneCount}/{items.length}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--color-slate-400)', transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {isExp && (
                    <table className="w-full">
                      <tbody>
                        {items.map((item, idx) => {
                          const isDone = checkedItems.has(item.id)
                          const sd = STATUS_DISPLAY[isDone ? 'done' : item.status]
                          return (
                            <tr
                              key={item.id}
                              style={{
                                borderBottom: idx < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                                backgroundColor: isDone ? 'rgba(45,90,61,0.03)' : 'transparent',
                              }}
                            >
                              {/* Checkbox */}
                              <td className="pl-5 pr-3 py-3 align-top" style={{ width: 28 }}>
                                <button
                                  onClick={() => toggleItem(item.id)}
                                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                                  style={{
                                    border: `1.5px solid ${isDone ? 'var(--color-status-active)' : 'var(--color-border-dark)'}`,
                                    backgroundColor: isDone ? 'var(--color-status-active)' : 'transparent',
                                    marginTop: 1,
                                  }}
                                >
                                  {isDone && (
                                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                      <path d="M1.5 4.5l2.5 2.5 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </button>
                              </td>

                              {/* Task */}
                              <td className="pr-4 py-3 align-top">
                                <div
                                  className="text-sm leading-snug"
                                  style={{
                                    color: isDone ? 'var(--color-slate-400)' : 'var(--color-navy)',
                                    fontSize: 12.5,
                                    textDecoration: isDone ? 'line-through' : 'none',
                                    textDecorationColor: 'var(--color-slate-300)',
                                  }}
                                >
                                  {item.priority === 'high' && !isDone && (
                                    <span className="text-xs mr-1" style={{ color: 'var(--color-risk-high)' }}>★</span>
                                  )}
                                  {item.task}
                                </div>
                                {item.note && !isDone && (
                                  <div className="text-xs mt-1 italic" style={{ color: 'var(--color-slate-500)', fontSize: 11 }}>
                                    {item.note}
                                  </div>
                                )}
                                {item.authority && (
                                  <div
                                    className="text-xs mt-1"
                                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy-400)', fontSize: 10 }}
                                  >
                                    {item.authority}
                                  </div>
                                )}
                              </td>

                              {/* Assignee */}
                              <td className="pr-4 py-3 align-top" style={{ width: 100 }}>
                                <span className="text-xs" style={{ color: 'var(--color-slate-600)', fontSize: 11 }}>
                                  {item.assignee}
                                </span>
                              </td>

                              {/* Due */}
                              <td className="pr-4 py-3 align-top" style={{ width: 120 }}>
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    color: item.due === 'Oct 14, 2024' ? 'var(--color-risk-high)' : isDone ? 'var(--color-slate-400)' : 'var(--color-slate-600)',
                                    fontSize: 11,
                                    fontWeight: item.due === 'Oct 14, 2024' ? 600 : 400,
                                  }}
                                >
                                  {item.due}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="pr-5 py-3 align-top" style={{ width: 90 }}>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: sd.bg, color: sd.color, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                >
                                  {sd.icon} {sd.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="max-w-2xl">
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="px-5 py-3" style={{ backgroundColor: 'var(--color-navy)', borderBottom: '1px solid var(--color-navy-700)' }}>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ivory)', fontSize: 13, fontWeight: 600 }}>
                2024-EST-0047 — Filing Timeline
              </span>
            </div>
            <div className="p-5">
              <div className="relative">
                <div
                  className="absolute left-16 top-0 bottom-0 w-px"
                  style={{ backgroundColor: 'var(--color-border)' }}
                />
                <ul className="space-y-0">
                  {DEADLINES.map((dl, i) => (
                    <li key={i} className="flex items-start gap-4 py-3" style={{ borderBottom: i < DEADLINES.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <div
                        className="w-16 text-right text-xs font-semibold shrink-0"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: 11, paddingTop: 1 }}
                      >
                        {dl.date}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full shrink-0 relative z-10 mt-0.5"
                        style={{
                          backgroundColor: dl.done
                            ? 'var(--color-status-active)'
                            : (dl as any).critical
                            ? 'var(--color-risk-high)'
                            : 'var(--color-gold)',
                          border: '2px solid white',
                          boxShadow: `0 0 0 1px ${dl.done ? 'var(--color-status-active)' : (dl as any).critical ? 'var(--color-risk-high)' : 'var(--color-gold)'}`,
                        }}
                      />
                      <div className="flex-1">
                        <div
                          className="text-sm"
                          style={{
                            color: dl.done
                              ? 'var(--color-slate-400)'
                              : (dl as any).critical
                              ? 'var(--color-risk-high)'
                              : 'var(--color-navy)',
                            fontSize: 12.5,
                            fontWeight: (dl as any).critical ? 700 : 400,
                            textDecoration: dl.done ? 'line-through' : 'none',
                          }}
                        >
                          {dl.task}
                        </div>
                        <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: 10 }}>
                          {dl.matter}
                          {(dl as any).critical && <span className="ml-2 text-xs" style={{ color: 'var(--color-risk-high)', fontSize: 10 }}>⚑ STATUTORY DEADLINE</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'filings' && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-navy)', borderBottom: '1px solid var(--color-navy-700)' }}>
                {['Form / Return', 'Description', 'Jurisdiction', 'Due Date', 'Extension', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-navy-200)', fontSize: 9.5 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { form: 'Form 706', desc: 'United States Estate Tax Return', jurisdiction: 'Federal', due: 'Oct 14, 2024', ext: 'Apr 14, 2025 (Form 4768)', status: 'pending', critical: true },
                { form: 'Form 8971', desc: 'Information Regarding Beneficiaries Acquiring Property', jurisdiction: 'Federal', due: 'Nov 13, 2024', ext: 'No extension', status: 'pending', critical: true },
                { form: 'ET-706 (NY)', desc: 'New York State Estate Tax Return', jurisdiction: 'New York', due: 'Oct 14, 2024', ext: 'Apr 14, 2025', status: 'pending', critical: false },
                { form: 'CT-706/709', desc: 'Connecticut Estate & Gift Tax Return', jurisdiction: 'Connecticut', due: 'TBD', ext: 'TBD', status: 'review', critical: false },
                { form: 'Final Form 1040', desc: 'Decedent\'s 2024 income tax return (Jan 1 – Jan 18)', jurisdiction: 'Federal', due: 'Apr 15, 2025', ext: 'Oct 15, 2025', status: 'pending', critical: false },
                { form: 'Form 1041', desc: 'Estate fiduciary income tax return (EIN required)', jurisdiction: 'Federal', due: 'Apr 15, 2025', ext: 'Sep 30, 2025', status: 'pending', critical: false },
              ].map((row, i, arr) => (
                <tr
                  key={row.form}
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-ivory-100)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                >
                  <td className="px-5 py-3">
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 12, fontWeight: 600 }}>
                      {row.form}
                    </span>
                    {row.critical && (
                      <span className="ml-1.5 text-xs" style={{ color: 'var(--color-risk-high)', fontSize: 10 }}>★</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-slate-600)', fontSize: 12 }}>{row.desc}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        fontSize: 10.5,
                        backgroundColor: row.jurisdiction === 'Federal' ? 'var(--color-navy-50)' : 'var(--color-gold-50)',
                        color: row.jurisdiction === 'Federal' ? 'var(--color-navy)' : 'var(--color-gold)',
                        border: `1px solid ${row.jurisdiction === 'Federal' ? 'var(--color-navy-100)' : 'var(--color-gold-200)'}`,
                      }}
                    >
                      {row.jurisdiction}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3 text-xs"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: row.critical ? 'var(--color-risk-high)' : 'var(--color-slate-600)',
                      fontSize: 11.5,
                      fontWeight: row.critical ? 700 : 400,
                    }}
                  >
                    {row.due}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-500)', fontSize: 11 }}>{row.ext}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: row.status === 'done' ? 'var(--color-status-active-bg)' : row.status === 'review' ? 'var(--color-status-review-bg)' : 'var(--color-risk-med-bg)',
                        color: row.status === 'done' ? 'var(--color-status-active)' : row.status === 'review' ? 'var(--color-status-review)' : 'var(--color-risk-med)',
                        fontSize: 10.5,
                      }}
                    >
                      {row.status === 'done' ? 'Filed' : row.status === 'review' ? 'Under Review' : 'Not Started'}
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
