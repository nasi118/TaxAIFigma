import { useState } from 'react'
import { ThemeProvider } from '@figma/astraui'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import ResearchPanel from './components/ResearchPanel'
import AnalysisPanel from './components/AnalysisPanel'
import WorkpaperPanel from './components/WorkpaperPanel'
import CompliancePanel from './components/CompliancePanel'
import PlanningPanel from './components/PlanningPanel'

export type NavSection = 'dashboard' | 'matters' | 'research' | 'analysis' | 'planning' | 'workpapers' | 'compliance'

export const ACTIVE_MATTER = {
  id: '2024-EST-0047',
  name: 'Estate of Harold W. Thornton III',
  type: 'Estate Tax — Form 706',
  status: 'active' as const,
  partner: 'James R. Morrison',
  manager: 'Eleanor K. Vasquez',
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard')

  return (
    <ThemeProvider>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
        <Sidebar active={activeSection} onNavigate={setActiveSection} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar activeSection={activeSection} onNavigate={setActiveSection} />
          <main className="flex-1 overflow-auto bg-ivory-100">
            {activeSection === 'dashboard' && <Dashboard onNavigate={setActiveSection} />}
            {activeSection === 'research' && <ResearchPanel />}
            {activeSection === 'analysis' && <AnalysisPanel />}
            {activeSection === 'planning' && <PlanningPanel />}
            {activeSection === 'workpapers' && <WorkpaperPanel />}
            {activeSection === 'compliance' && <CompliancePanel />}
            {activeSection === 'matters' && <Dashboard onNavigate={setActiveSection} />}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

