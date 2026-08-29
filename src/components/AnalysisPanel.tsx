import { useState } from 'react'

const MEMO_SECTIONS = [
  {
    id: 'header',
    type: 'header',
    content: {
      to: 'File',
      from: 'James R. Morrison / Eleanor K. Vasquez',
      re: 'Validity and Optimization of Partial QTIP Election — Estate of Harold W. Thornton III',
      date: 'August 14, 2024',
      matter: '2024-EST-0047',
      status: 'AI Draft — Practitioner Review Pending',
    },
  },
  {
    id: 'issues',
    type: 'practitioner',
    label: 'Issues Presented',
    content: [
      '1. Whether a partial QTIP election under § 2056(b)(7)(B)(iv) may be expressed as a formula fractional share of the marital trust, and whether such election qualifies for the estate tax marital deduction.',
      '2. Whether the formula fraction approach satisfies the ascertainability requirement of Treas. Reg. § 20.2056(b)-7(b)(3), and whether PLR 202234012 provides sufficient precedential guidance.',
      '3. Whether, in light of the anticipated TCJA sunset effective January 1, 2026, an optimized marital deduction election should preserve maximum DSUE for the surviving spouse, and what amount of credit-shelter funding is advisable.',
    ],
  },
  {
    id: 'brief-answer',
    type: 'practitioner',
    label: 'Brief Answers',
    content: [
      '1. Yes. A partial QTIP election expressed as a formula fractional share is permissible under § 2056(b)(7)(B)(iv). The fraction must be ascertainable at the time of election, and the entire elected share must satisfy the income interest requirements of § 2056(b)(7)(B)(i)–(iii). See Treas. Reg. § 20.2056(b)-7(b)(3).',
      '2. Yes, subject to risk. PLR 202234012 supports the formula approach, though private letter rulings are not binding precedent under § 6110(k)(3). The formula expression is consistent with Rev. Rul. 79-397 and subsequent IRS guidance. Recommend independent filing of Form 706 with protective disclosure.',
      '3. Strongly recommended. Current gross estate of $24.7M against 2024 exemption of $13.61M produces net federal estate tax of approximately $122,000 on current facts. Post-sunset, the effective exemption of approximately $7M produces estimated estate tax exposure of $2.77M on the credit shelter amount. Optimizing the marital deduction to defer maximum tax to surviving spouse\'s estate is advisable, with contemporaneous SLAT/GRAT planning.',
    ],
  },
  {
    id: 'ai-facts',
    type: 'ai',
    label: 'Facts',
    aiNote: 'AI-compiled from uploaded estate inventory and draft Form 706. Verify all values against certified appraisals.',
    content: `Decedent Harold W. Thornton III died testate on January 18, 2024, a domiciliary of New York. He is survived by his spouse, Margaret A. Thornton (age 71), and three adult children from a prior marriage. The Will creates a Credit Shelter Trust (the "Bypass Trust") and a Marital Trust, with the executor directed to fund each trust in accordance with a formula marital deduction clause.

Gross Estate (as reported on draft Form 706):
  Real property (Schedule A):          $8,450,000
  Stocks and bonds (Schedule B):       $11,200,000
  Mortgages, notes, cash (Schedule C):  $1,850,000
  Jointly owned property (Schedule E):  $2,700,000
  Other misc. property (Schedule F):      $500,000
  ─────────────────────────────────────────────────
  Total Gross Estate:                  $24,700,000

Deductions:
  Funeral and admin. expenses:           ($185,000)
  Debts of decedent:                     ($300,000)
  Total deductions:                      ($485,000)

Adjusted Gross Estate:                 $24,215,000

Formula Marital Deduction (proposed):   $9,800,000
  (Expressed as the smallest fractional share necessary to reduce federal estate tax to zero, but not less than $0)

Charitable Deduction (Cl. 4 bequest):    $500,000

Taxable Estate (proposed):             $13,915,000
  → Exceeds 2024 exemption by $305,000
  → Net estate tax ≈ $122,000 (see workpaper EST-0047-WP-001)`,
  },
  {
    id: 'ai-analysis-auth',
    type: 'ai',
    label: 'Analysis — Applicable Authority',
    aiNote: 'AI-generated legal analysis. All cited authorities independently verified. Conclusions require practitioner review before reliance.',
    content: `A. Marital Deduction — § 2056(b)(7) QTIP Requirements

Section 2056(b)(7) allows an estate tax marital deduction for "qualified terminable interest property" (QTIP) with respect to which the executor makes an election on the Form 706. For property to qualify as QTIP, the surviving spouse must have a "qualifying income interest for life" under § 2056(b)(7)(B)(ii), meaning: (i) the spouse is entitled to all income from the property, payable at least annually; (ii) no person has a power to appoint any part of the property to any person other than the surviving spouse during the spouse's lifetime; and (iii) no portion of the property passes to anyone other than the surviving spouse during the surviving spouse's lifetime. I.R.C. § 2056(b)(7)(B)(ii)(I)–(III).

B. Partial QTIP Election — Fractional Share Requirement

Section 2056(b)(7)(B)(iv) expressly permits a partial election with respect to a "fractional or percentage share" of the property. The operative regulation, Treas. Reg. § 20.2056(b)-7(b)(3), requires that the fraction or percentage be "ascertainable at the time of election." The IRS confirmed in PLR 202234012 (Aug. 24, 2022) that a formula-based fraction satisfies the ascertainability requirement where the formula incorporates only the applicable exemption amount, gross estate value, and allowable deductions — all determinable from the filed return.

Practitioner Note: The Tax Court's holding in Estate of Clayton v. Commissioner, 97 T.C. 327 (1991), aff'd 976 F.2d 1486 (5th Cir. 1992), is materially distinguished. Clayton involved a pecuniary formula election (fixed dollar amount), not a fractional share; the court held a pecuniary formula did not satisfy the "all income" requirement because the trust division was not complete at the date of death. The proposed election uses a fractional share, not a pecuniary amount, and is therefore distinguishable.

C. Credit Shelter / DSUE Optimization

The estate should evaluate whether maximum use of the § 2010 unified credit produces optimal wealth transfer. Under current facts (2024 exemption of $13,610,000; Taxable Estate $13,915,000), the credit shelter amount produces nominal estate tax exposure. However, the TCJA sunset risk significantly alters this calculus.

If TCJA sunsets as scheduled, the post-2025 applicable exclusion amount is estimated at approximately $7,000,000 (subject to Treasury guidance). The surviving spouse's estate, including QTIP inclusion under § 2044, would face substantial estate tax exposure. Portability (§ 2010(c)) should be preserved by timely filing of the Form 706 and a portability election, but portability is not indexed for appreciation, whereas the exclusion amount may be indexed post-sunset under the anti-clawback regulations.

D. Recommendation

Recommend the following election strategy:
  1. Make a partial QTIP election expressed as a formula fractional share of the Marital Trust, in the amount of the smallest fraction necessary to reduce estate tax to zero (using 2024 exemption of $13,610,000).
  2. Fund the Credit Shelter Trust with the maximum applicable exclusion amount ($13,610,000 less applicable deductions), preserving the unified credit and utilizing maximum basis step-up under § 1014.
  3. File Form 706 with portability election and disclose the formula QTIP methodology on an attached statement citing PLR 202234012 and Rev. Rul. 79-397.
  4. Advise the surviving spouse to initiate SLAT or GRAT planning before December 31, 2025 to utilize the enhanced exemption before potential sunset.`,
  },
  {
    id: 'practitioner-conclusion',
    type: 'practitioner',
    label: 'Practitioner Conclusion & Sign-Off',
    verified: true,
    content: `Based on the foregoing analysis, the partial QTIP election expressed as a formula fractional share is supportable under applicable authority. The primary residual risk is reliance on PLR 202234012, which is not binding precedent. We recommend independent analysis and a protective disclosure on the filed Form 706.

The analysis regarding TCJA sunset planning requires client consultation before implementation. Client must be advised of the gift tax implications of any inter vivos transfers during the 2024–2025 window.

Sign-off required from: J. Morrison (Senior Tax Counsel) | E. Vasquez (Manager) | T. Caldwell (Reviewer)

⬜ JRM — Reviewed, approved    [  ] EKV — Reviewed, approved    [  ] TC — Reviewed, approved`,
  },
]

const VERSION_HISTORY = [
  { v: 'v2 (Current)', date: 'Aug 14, 2024', by: 'AI + E. Vasquez', note: 'Added TCJA sunset analysis, updated PLR citation' },
  { v: 'v1', date: 'Aug 8, 2024', by: 'AI (Initial Draft)', note: 'Initial AI-generated draft from research library' },
]

function AIBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
      style={{
        backgroundColor: 'var(--color-ai-bg)',
        color: 'var(--color-ai-text)',
        border: '1px solid rgba(91,127,212,0.3)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M3 5h4M5 3v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      AI Generated
    </span>
  )
}

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
      style={{
        backgroundColor: 'var(--color-verified-bg)',
        color: 'var(--color-verified-text)',
        border: '1px solid rgba(61,122,74,0.25)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L1 3v3c0 2 1.5 3.5 4 4 2.5-.5 4-2 4-4V3L5 1z" stroke="currentColor" strokeWidth="1"/>
        <path d="M3 5l1.5 1.5 2.5-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Practitioner
    </span>
  )
}

export default function AnalysisPanel() {
  const [showVersions, setShowVersions] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['issues', 'brief-answer', 'ai-facts', 'ai-analysis-auth', 'practitioner-conclusion'])
  )
  const [activeTab, setActiveTab] = useState<'memo' | 'citations' | 'assumptions'>('memo')

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Main Memo Area */}
      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-ivory-100)' }}>
        <div className="max-w-3xl mx-auto">
          {/* Memo Header Card */}
          <div
            className="rounded-lg overflow-hidden mb-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-navy)',
                borderBottom: '1px solid var(--color-navy-700)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ivory)', fontSize: 13, fontWeight: 600 }}>
                Technical Memorandum
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(91,127,212,0.3)', color: '#8aacf0', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                >
                  AI Draft
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(217,112,112,0.2)', color: '#f0a0a0', fontSize: 10 }}
                >
                  Review Pending
                </span>
              </div>
            </div>

            {/* Memo Header Table */}
            <div className="p-5">
              <table className="w-full text-xs">
                <tbody>
                  {[
                    ['To', 'File'],
                    ['From', 'James R. Morrison / Eleanor K. Vasquez'],
                    ['Date', 'August 14, 2024'],
                    ['Re', 'Validity and Optimization of Partial QTIP Election — Estate of Harold W. Thornton III'],
                    ['Matter', '2024-EST-0047'],
                    ['Confidentiality', 'Attorney-Client Privilege / Work Product — Do Not Distribute'],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td
                        className="py-2 pr-4 font-semibold uppercase tracking-widest align-top"
                        style={{ color: 'var(--color-slate-400)', fontSize: 9.5, width: 120 }}
                      >
                        {k}
                      </td>
                      <td
                        className="py-2 align-top"
                        style={{
                          color: k === 'Confidentiality' ? 'var(--color-risk-high)' : 'var(--color-navy)',
                          fontSize: 12,
                          fontFamily: k === 'Matter' ? 'var(--font-mono)' : 'inherit',
                        }}
                      >
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {(['memo', 'citations', 'assumptions'] as const).map(tab => (
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
                {tab === 'memo' ? 'Memorandum' : tab === 'citations' ? 'Source Citations' : 'Assumptions & Risks'}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="px-3 py-2 text-xs transition-colors"
              style={{ color: 'var(--color-slate-400)', fontSize: 11 }}
            >
              ⊞ v2 (current) ▾
            </button>
          </div>

          {/* Version History Dropdown */}
          {showVersions && (
            <div
              className="rounded-lg mb-4 overflow-hidden"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              {VERSION_HISTORY.map((v, i) => (
                <div
                  key={v.v}
                  className="px-4 py-2.5 flex items-center gap-4 text-xs"
                  style={{ borderBottom: i < VERSION_HISTORY.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 11, minWidth: 80 }}>{v.v}</span>
                  <span style={{ color: 'var(--color-slate-400)', fontSize: 10.5, minWidth: 100 }}>{v.date}</span>
                  <span style={{ color: 'var(--color-slate-500)', fontSize: 11 }}>{v.by}</span>
                  <span style={{ color: 'var(--color-slate-600)', fontSize: 11, flex: 1 }}>{v.note}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'memo' && (
            <div className="space-y-3">
              {MEMO_SECTIONS.filter(s => s.id !== 'header').map((section) => {
                const isExpanded = expandedSections.has(section.id)
                const isAI = section.type === 'ai'

                return (
                  <div
                    key={section.id}
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: isAI
                        ? '1px solid rgba(91,127,212,0.35)'
                        : '1px solid var(--color-border)',
                      backgroundColor: isAI
                        ? 'var(--color-ai-bg)'
                        : 'var(--color-card)',
                    }}
                  >
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                      style={{
                        borderBottom: isExpanded ? (isAI ? '1px solid rgba(91,127,212,0.2)' : '1px solid var(--color-border)') : 'none',
                      }}
                      onClick={() => toggleSection(section.id)}
                    >
                      <span
                        className="text-xs font-semibold uppercase tracking-widest flex-1"
                        style={{ color: isAI ? 'var(--color-ai-text)' : 'var(--color-navy)', fontSize: 10.5 }}
                      >
                        {section.label}
                      </span>
                      {isAI ? <AIBadge /> : (section as any).verified ? <VerifiedBadge /> : <VerifiedBadge />}
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                        style={{ color: 'var(--color-slate-400)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      >
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-5 py-4">
                        {isAI && (section as any).aiNote && (
                          <div
                            className="text-xs mb-3 px-3 py-2 rounded flex items-start gap-2"
                            style={{
                              backgroundColor: 'rgba(91,127,212,0.12)',
                              border: '1px solid rgba(91,127,212,0.25)',
                              color: 'var(--color-ai-text)',
                              fontSize: 10.5,
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0 mt-0.5">
                              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1"/>
                              <path d="M5.5 3v3M5.5 7.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                            </svg>
                            {(section as any).aiNote}
                          </div>
                        )}
                        {Array.isArray(section.content) ? (
                          <ul className="space-y-2">
                            {(section.content as string[]).map((item, i) => (
                              <li
                                key={i}
                                className="text-sm leading-relaxed pl-3"
                                style={{
                                  color: 'var(--color-navy)',
                                  fontSize: 13,
                                  lineHeight: 1.75,
                                  borderLeft: '2px solid var(--color-border-dark)',
                                }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <pre
                            className="whitespace-pre-wrap text-sm leading-relaxed"
                            style={{
                              fontFamily: typeof section.content === 'string' && section.content.includes('$') ? 'var(--font-mono)' : 'var(--font-sans)',
                              color: 'var(--color-navy)',
                              fontSize: 12.5,
                              lineHeight: 1.8,
                            }}
                          >
                            {section.content as string}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'citations' && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-ivory-100)' }}>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
                  7 Sources Referenced
                </span>
              </div>
              {[
                { cite: 'I.R.C. § 2056(b)(7)', desc: 'Primary authority — QTIP election', type: 'IRC', uses: 8 },
                { cite: 'Treas. Reg. § 20.2056(b)-7', desc: 'Partial election requirements', type: 'Treasury Reg.', uses: 5 },
                { cite: 'PLR 202234012', desc: 'Formula fraction ruling', type: 'PLR / TAM', uses: 3 },
                { cite: 'Estate of Clayton, 97 T.C. 327', desc: 'Distinguished — pecuniary formula', type: 'Case Law', uses: 2 },
                { cite: 'Rev. Proc. 2001-38', desc: 'Excessive election void procedure', type: 'IRS Guidance', uses: 1 },
                { cite: 'Rev. Rul. 79-397', desc: 'Formula fraction ascertainability', type: 'IRS Guidance', uses: 2 },
                { cite: 'I.R.C. § 2010(c)', desc: 'Portability of DSUE', type: 'IRC', uses: 2 },
              ].map((c, i, arr) => (
                <div
                  key={c.cite}
                  className="px-5 py-3 flex items-center gap-4"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <span className="text-xs px-2 py-0.5 rounded w-20 text-center shrink-0"
                    style={{
                      fontSize: 9.5,
                      backgroundColor: c.type === 'IRC' ? 'var(--color-navy-50)' : c.type === 'PLR / TAM' ? 'var(--color-risk-med-bg)' : c.type === 'Case Law' ? 'var(--color-status-done-bg)' : 'var(--color-status-active-bg)',
                      color: c.type === 'IRC' ? 'var(--color-navy)' : c.type === 'PLR / TAM' ? 'var(--color-risk-med)' : c.type === 'Case Law' ? 'var(--color-status-done)' : 'var(--color-status-active)',
                    }}
                  >
                    {c.type}
                  </span>
                  <div className="flex-1">
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 12 }}>{c.cite}</div>
                    <div className="text-xs" style={{ color: 'var(--color-slate-500)', fontSize: 11 }}>{c.desc}</div>
                  </div>
                  <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: 10.5 }}>
                    {c.uses}× cited
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'assumptions' && (
            <div className="space-y-3">
              {[
                {
                  type: 'assumption',
                  label: 'Key Assumptions',
                  items: [
                    'Gross estate values based on preliminary draft Form 706; not yet supported by certified appraisals for Schedule A real property.',
                    '2024 applicable exclusion amount of $13,610,000 per IRS Rev. Proc. 2023-34.',
                    'Date of death: January 18, 2024; Form 706 due October 14, 2024 (9 months) without extension.',
                    'Surviving spouse is a U.S. citizen; no § 2056A QDOT required.',
                    'No prior taxable gifts reported; adjusted taxable gifts = $0.',
                    'Portability election available; Form 706 filing required to preserve DSUE.',
                  ],
                },
                {
                  type: 'risk',
                  label: 'Open Issues & Risks',
                  items: [
                    'RISK (HIGH): Schedule A real property appraisals not yet complete. Preliminary values may require adjustment, affecting formula QTIP fraction.',
                    'RISK (MED): PLR 202234012 relied on as persuasive authority only. IRS could challenge formula fraction under Clayton on audit.',
                    'RISK (HIGH): TCJA sunset planning is time-sensitive. Window closes December 31, 2025. Anti-clawback regulations (T.D. 9884) may provide some protection for pre-sunset gifts.',
                    'RISK (LOW): Charitable deduction of $500,000 (Clause 4 bequest) pending confirmation of beneficiary § 501(c)(3) status.',
                    'OPEN: Decision on credit-shelter trust funding amount not yet finalized with client. Recommend meeting before September 1, 2024.',
                  ],
                },
              ].map((block) => (
                <div
                  key={block.label}
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    border: `1px solid ${block.type === 'risk' ? 'var(--color-risk-med-border)' : 'var(--color-border)'}`,
                  }}
                >
                  <div
                    className="px-5 py-2.5"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: block.type === 'risk' ? 'var(--color-risk-med-bg)' : 'var(--color-ivory-100)',
                    }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: block.type === 'risk' ? 'var(--color-risk-med)' : 'var(--color-slate-400)', fontSize: 9.5 }}>
                      {block.label}
                    </span>
                  </div>
                  <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {block.items.map((item, i) => (
                      <li key={i} className="px-5 py-2.5 text-xs leading-relaxed" style={{ color: 'var(--color-navy)', fontSize: 12 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Rail — Quick Citations */}
      <div
        className="shrink-0 overflow-y-auto"
        style={{
          width: 240,
          backgroundColor: 'var(--color-card)',
          borderLeft: '1px solid var(--color-border)',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-ivory-100)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
            Quick Refs
          </div>
        </div>
        <div className="p-3 space-y-2">
          {[
            { cite: '§ 2056(b)(7)', note: 'QTIP Election', type: 'IRC' },
            { cite: 'Reg. § 20.2056(b)-7', note: 'Partial election rules', type: 'Reg' },
            { cite: 'PLR 202234012', note: 'Formula fraction OK', type: 'PLR' },
            { cite: '97 T.C. 327', note: 'Clayton — distinguished', type: 'Case' },
            { cite: '§ 2010(c)', note: 'Portability / DSUE', type: 'IRC' },
            { cite: 'Rev. Proc. 2001-38', note: 'Void election safe harbor', type: 'Rev.P.' },
            { cite: 'T.D. 9884', note: 'Anti-clawback regs', type: 'Reg' },
          ].map((ref) => (
            <div
              key={ref.cite}
              className="rounded p-2.5 cursor-pointer transition-colors"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-ivory-100)' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-navy-200)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'}
            >
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 11 }}>{ref.cite}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-slate-500)', fontSize: 10.5 }}>{ref.note}</div>
            </div>
          ))}
        </div>

        {/* AI Disclaimer */}
        <div
          className="mx-3 mb-3 rounded p-3"
          style={{ backgroundColor: 'var(--color-ai-bg)', border: '1px solid rgba(91,127,212,0.25)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <AIBadge />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ai-text)', fontSize: 10.5 }}>
            AI-generated content is a research aid only. All conclusions and citations must be independently verified by a licensed tax professional before client advice or filing.
          </p>
        </div>
      </div>
    </div>
  )
}
