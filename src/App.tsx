import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { loadAppData } from './data/loader'
import { Header } from './components'
import Overview from './pages/Overview'
import Remediation from './pages/Remediation'
import Benchmark from './pages/Benchmark'
import Impact from './pages/Impact'
import ClusterDetail from './pages/ClusterDetail'
import DimensionDetail from './pages/DimensionDetail'
import FindingList from './pages/FindingList'
import OverviewV2 from './pages/OverviewV2'

const appData = loadAppData()

export default function App() {
  const [selectedSystemId, setSelectedSystemId] = useState(appData.systems[0].id)
  const selectedSystem = appData.systems.find(s => s.id === selectedSystemId) ?? appData.systems[0]

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen" style={{ padding: '32px', overflowX: 'hidden' }}>
        <div className="flex flex-col gap-8" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <Header
            systems={appData.systems}
            selectedSystemId={selectedSystemId}
            onSystemChange={setSelectedSystemId}
          />
          <Routes>
            <Route path="/" element={<Overview system={selectedSystem} />} />
            <Route path="/remediation" element={<Remediation system={selectedSystem} />} />
            <Route path="/benchmark" element={<Benchmark systems={appData.systems} />} />
            <Route path="/impact" element={<Impact system={selectedSystem} />} />
            <Route path="/cluster/:clusterId" element={<ClusterDetail system={selectedSystem} dimensionRef={appData.dimensionRef} />} />
            <Route path="/dimension/:dimensionId" element={<DimensionDetail system={selectedSystem} dimensionRef={appData.dimensionRef} />} />
            <Route path="/findings" element={<FindingList system={selectedSystem} />} />
            <Route path="/overview-v2" element={<OverviewV2 system={selectedSystem} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
