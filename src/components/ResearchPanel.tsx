import { useState } from 'react'

const SOURCE_TYPES = ['IRC', 'Treasury Reg.', 'Case Law', 'IRS Guidance', 'State', 'Foreign', 'PLR / TAM']

const SOURCES = [
  {
    id: 'irc-2056',
    type: 'IRC',
    cite: 'I.R.C. § 2056',
    title: 'Bequests, Etc., to Surviving Spouse (Marital Deduction)',
    relevance: 'Primary authority — marital deduction qualification; QTIP election framework',
    tags: ['Estate Tax', 'QTIP', 'Marital Deduction', 'EST-0047'],
    pinned: true,
    excerpt: `(a) Allowance of marital deduction. For purposes of the tax imposed by section 2001, the value of the taxable estate shall, except as limited by subsection (b), be determined by deducting from the value of the gross estate an amount equal to the value of any interest in property which passes or has passed from the decedent to his surviving spouse...

(b)(7) Election with respect to life estate for surviving spouse.—
(A) In general.— In the case of qualified terminable interest property—
(i) for purposes of subsection (a), such property shall be treated as passing to the surviving spouse, and
(ii) for purposes of paragraph (1), no part of such property shall be treated as passing to any person other than the surviving spouse.
(B) Qualified terminable interest property defined.— For purposes of this paragraph—
(i) In general.— The term "qualified terminable interest property" means property—
(I) which passes from the decedent,
(II) in which the surviving spouse has a qualifying income interest for life, and
(III) to which an election under this paragraph applies.
(iv) Partial election.— If an election under this paragraph is made with respect to any property, such election shall be treated as made with respect to the entire interest of the decedent in such property, except that an election may be made with respect to a fractional or percentage share of such property.`,
    fullText: true,
    lastUpdated: '2024 Ed.',
  },
  {
    id: 'reg-2056b7',
    type: 'Treasury Reg.',
    cite: 'Treas. Reg. § 20.2056(b)-7',
    title: 'Election with Respect to Life Estate for Surviving Spouse — QTIP Trust Requirements',
    relevance: 'Operative authority — requirements for partial QTIP election, fractional share rules',
    tags: ['Estate Tax', 'QTIP', 'Partial Election', 'EST-0047'],
    pinned: true,
    excerpt: `(b) Qualified terminable interest property—
(2) Qualifying income interest for life. A surviving spouse has a qualifying income interest for life if the surviving spouse is entitled to all the income from the property, payable annually or at more frequent intervals, or has a usufruct interest for life in the property...

(b)(2)(iii) Election. The election must be made on the return of tax imposed by section 2001...

(b)(3) Partial election. A partial election may be made with respect to a fractional or percentage share of the property, provided that the fraction or percentage—
(i) Is ascertainable at the time of election; and
(ii) Is either a fractional share of the entire property or a pecuniary amount.`,
    fullText: false,
    lastUpdated: 'T.D. 8522 (1994)',
  },
  {
    id: 'case-clayton',
    type: 'Case Law',
    cite: 'Estate of Clayton v. Commissioner, 97 T.C. 327 (1991)',
    title: 'QTIP Partial Election — Fractional vs. Pecuniary Formula',
    relevance: 'Precedent — partial QTIP election may not create non-qualifying income interest for remainder',
    tags: ['QTIP', 'Partial Election', 'Case Law', 'EST-0047'],
    pinned: false,
    excerpt: `The Tax Court held that a partial QTIP election must be expressed as a fractional or percentage share of the entire trust, not a pecuniary formula amount. A pecuniary formula election does not qualify because the surviving spouse's right to income is not ascertainable at the time of election and may not satisfy the "all income" requirement under § 2056(b)(7)(B)(ii).

The IRS subsequently issued Rev. Proc. 2001-38 and Prop. Reg. § 20.2056(b)-7(b)(3) to provide safe harbor rules for partial QTIP elections, substantially limiting the scope of Clayton in the context of reformations.`,
    fullText: false,
    lastUpdated: 'aff\'d 976 F.2d 1486 (5th Cir. 1992)',
  },
  {
    id: 'revproc-200138',
    type: 'IRS Guidance',
    cite: 'Rev. Proc. 2001-38, 2001-1 C.B. 1335',
    title: 'Voiding of QTIP Elections Made on Non-Portability Estates',
    relevance: 'Safe harbor — IRS will treat excessive QTIP elections as void when no estate tax would have been due',
    tags: ['QTIP', 'IRS Guidance', 'Election', 'EST-0047'],
    pinned: false,
    excerpt: `This revenue procedure provides a procedure for requesting that the Internal Revenue Service treat a QTIP election as null and void. An executor who made a QTIP election under § 2056(b)(7) on the decedent's estate tax return when no estate tax would have been due if the election had not been made may request that the election be treated as null and void...

Note: Superseded in part by Rev. Proc. 2016-49 (portability contexts).`,
    fullText: false,
    lastUpdated: 'Partially superseded 2016',
  },
  {
    id: 'plr-202234',
    type: 'PLR / TAM',
    cite: 'PLR 202234012',
    title: 'Partial QTIP Election — Fractional Share Expressed as Formula',
    relevance: 'IRS ruled formula-based fractional QTIP election valid where fraction is ascertainable from trust instrument',
    tags: ['QTIP', 'PLR', 'Partial Election', 'EST-0047'],
    pinned: false,
    excerpt: `Taxpayer requested ruling that proposed partial QTIP election satisfies the fractional share requirement of Treas. Reg. § 20.2056(b)-7(b)(3) where the elected fraction is expressed as: "the smallest fractional share necessary to reduce the federal estate tax to zero, applying the maximum marital deduction formula."

The IRS ruled favorably, noting that the fraction is ascertainable at the time of election by reference to the applicable exemption amount, the value of the gross estate, and allowable deductions, consistent with the holding in Rev. Rul. 79-397.`,
    fullText: false,
    lastUpdated: 'Aug. 24, 2022',
  },
  {
    id: 'irc-2044',
    type: 'IRC',
    cite: 'I.R.C. § 2044',
    title: 'Certain Property for Which Marital Deduction Was Previously Allowed',
    relevance: 'Inclusion in surviving spouse\'s estate of QTIP trust corpus on surviving spouse\'s death',
    tags: ['Estate Tax', 'QTIP', 'Inclusion', 'EST-0047'],
    pinned: false,
    excerpt: `(a) General rule. The value of the gross estate shall include the value of any property to which this section applies in which the decedent had a qualifying income interest for life...

(b) Property to which this section applies. This section applies to any property if—
(1) a deduction was allowed with respect to the transfer of such property to the decedent—
(A) under section 2056 by reason of subsection (b)(7) thereof, or
(B) under section 2523 by reason of subsection (f) thereof, and
(2) section 2519 (relating to dispositions of certain life estates) did not apply with respect to a disposition by the decedent of part or all of such property.`,
    fullText: false,
    lastUpdated: '2024 Ed.',
  },
]

export default function ResearchPanel() {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(SOURCE_TYPES))
  const [selectedId, setSelectedId] = useState<string>('irc-2056')
  const [searchValue, setSearchValue] = useState('')

  const toggleType = (t: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) { next.delete(t) } else { next.add(t) }
      return next
    })
  }

  const filtered = SOURCES.filter(s => {
    const matchType = activeTypes.has(s.type)
    const matchSearch = !searchValue ||
      s.cite.toLowerCase().includes(searchValue.toLowerCase()) ||
      s.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchValue.toLowerCase()))
    return matchType && matchSearch
  })

  const selected = SOURCES.find(s => s.id === selectedId)

  const SOURCE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'IRC':           { bg: 'var(--color-navy-50)',       text: 'var(--color-navy)',       border: 'var(--color-navy-100)' },
    'Treasury Reg.': { bg: 'var(--color-gold-50)',       text: 'var(--color-gold)',        border: 'var(--color-gold-200)' },
    'Case Law':      { bg: 'var(--color-status-done-bg)', text: 'var(--color-status-done)', border: 'var(--color-navy-100)' },
    'IRS Guidance':  { bg: 'var(--color-status-active-bg)', text: 'var(--color-status-active)', border: 'rgba(30,90,53,0.2)' },
    'PLR / TAM':     { bg: 'var(--color-risk-med-bg)',   text: 'var(--color-risk-med)',   border: 'var(--color-gold-200)' },
    'State':         { bg: 'var(--color-slate-50)',      text: 'var(--color-slate)',      border: 'var(--color-slate-200)' },
    'Foreign':       { bg: 'var(--color-slate-50)',      text: 'var(--color-slate)',      border: 'var(--color-slate-200)' },
  }

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Left: Source List */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: 360, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        {/* Search + Filters */}
        <div className="p-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div
            className="flex items-center gap-2 px-3 rounded mb-3"
            style={{ height: 34, backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-border)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--color-slate-400)' }}>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.25"/>
              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            </svg>
            <input
              className="flex-1 bg-transparent outline-none text-xs"
              placeholder="Search citations, IRC sections, keywords…"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              style={{ fontSize: 12, color: 'var(--color-navy)' }}
            />
          </div>
          <div className="text-xs mb-2 font-semibold uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
            Source Type
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_TYPES.map(t => {
              const active = activeTypes.has(t)
              const style = SOURCE_TYPE_COLORS[t] || SOURCE_TYPE_COLORS['State']
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className="text-xs px-2 py-0.5 rounded transition-all"
                  style={{
                    fontSize: 10.5,
                    backgroundColor: active ? style.bg : 'transparent',
                    color: active ? style.text : 'var(--color-slate-400)',
                    border: `1px solid ${active ? style.border : 'var(--color-border)'}`,
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs flex items-center justify-between" style={{ backgroundColor: 'var(--color-ivory-100)', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-slate-500)', fontSize: 10.5 }}>
              {filtered.length} source{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-1">
              <span className="text-xs" style={{ color: 'var(--color-navy-400)', fontSize: 10.5, cursor: 'pointer' }}>★ Pinned first</span>
            </div>
          </div>
          <ul>
            {[...filtered.filter(s => s.pinned), ...filtered.filter(s => !s.pinned)].map((source, i, arr) => {
              const isActive = selectedId === source.id
              const typeStyle = SOURCE_TYPE_COLORS[source.type] || SOURCE_TYPE_COLORS['State']
              return (
                <li
                  key={source.id}
                  className="px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--color-navy-50)' : 'transparent',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                    borderLeft: isActive ? '2px solid var(--color-navy-400)' : '2px solid transparent',
                  }}
                  onClick={() => setSelectedId(source.id)}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded shrink-0"
                      style={{ fontSize: 9.5, backgroundColor: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}` }}
                    >
                      {source.type}
                    </span>
                    {source.pinned && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-gold)', fontSize: 10 }}>★</span>
                    )}
                  </div>
                  <div
                    className="font-semibold mt-1.5"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontSize: 11.5 }}
                  >
                    {source.cite}
                  </div>
                  <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-slate-600)', fontSize: 11 }}>
                    {source.title}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {source.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 rounded"
                        style={{ fontSize: 9.5, backgroundColor: 'var(--color-slate-100)', color: 'var(--color-slate-500)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Right: Citation Detail */}
      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-ivory-100)' }}>
        {selected ? (
          <div className="max-w-3xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const ts = SOURCE_TYPE_COLORS[selected.type] || SOURCE_TYPE_COLORS['State']
                    return (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: ts.bg, color: ts.text, border: `1px solid ${ts.border}`, fontSize: 10.5 }}
                      >
                        {selected.type}
                      </span>
                    )
                  })()}
                  <span className="text-xs" style={{ color: 'var(--color-slate-400)', fontSize: 10.5 }}>
                    {selected.lastUpdated}
                  </span>
                </div>
                <h1
                  className="font-bold leading-snug"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-navy)' }}
                >
                  {selected.cite}
                </h1>
                <div className="text-sm mt-1" style={{ color: 'var(--color-slate-600)', fontSize: 13 }}>
                  {selected.title}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="text-xs px-3 py-1.5 rounded transition-colors"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-slate)', fontSize: 11 }}
                >
                  + Add to Matter
                </button>
                <button
                  className="text-xs px-3 py-1.5 rounded transition-colors"
                  style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-ivory)', fontSize: 11 }}
                >
                  Cite in Analysis →
                </button>
              </div>
            </div>

            {/* Relevance Note */}
            <div
              className="rounded-md p-3 mb-4 flex gap-2"
              style={{ backgroundColor: 'var(--color-gold-50)', border: '1px solid var(--color-gold-200)' }}
            >
              <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--color-gold)' }}>◆</span>
              <div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-gold)', fontSize: 10.5 }}>
                  Practitioner Note — EST-0047:
                </span>
                <span className="text-xs ml-1" style={{ color: 'var(--color-risk-med)', fontSize: 11 }}>
                  {selected.relevance}
                </span>
              </div>
            </div>

            {/* Full Text Block */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-ivory-100)' }}
              >
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
                  Excerpt — Authoritative Text
                </span>
                {!selected.fullText && (
                  <span className="text-xs" style={{ color: 'var(--color-slate-400)', fontSize: 10.5 }}>
                    Excerpt only — full text available in Westlaw / Bloomberg Law
                  </span>
                )}
              </div>
              <div className="p-5">
                <pre
                  className="whitespace-pre-wrap text-xs leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-navy)',
                    fontSize: 12,
                    lineHeight: 1.8,
                  }}
                >
                  {selected.excerpt}
                </pre>
              </div>
            </div>

            {/* Related Sources */}
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
                Related Authority
              </div>
              <div className="flex flex-wrap gap-2">
                {SOURCES.filter(s => s.id !== selected.id && s.tags.some(t => selected.tags.includes(t))).slice(0, 4).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className="text-xs px-3 py-1.5 rounded transition-colors text-left"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-navy-400)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-navy-300)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'}
                  >
                    {s.cite}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation History */}
            <div
              className="mt-4 rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-slate-400)', fontSize: 9.5 }}>
                Citation Usage in This Matter
              </div>
              {['AI Analysis — QTIP Election Memo (v2, Aug 14, 2024)', 'Workpaper EST-0047-WP-002 — Marital Deduction Computation'].map((usage, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i === 0 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ color: 'var(--color-navy-300)', fontSize: 11 }}>↗</span>
                  <span className="text-xs" style={{ color: 'var(--color-navy-400)', fontSize: 11 }}>{usage}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-slate-400)' }}>
            <p className="text-sm">Select a source to view citation detail</p>
          </div>
        )}
      </div>
    </div>
  )
}
