import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';

// Exactly 7 Pages + Dataset Studio
import { DashboardPage } from './pages/DashboardPage';
import { TrafficAnalysisPage } from './pages/TrafficAnalysisPage';
import { HotspotsPage } from './pages/HotspotsPage';
import { TimeAnalysisPage } from './pages/TimeAnalysisPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { InsightsPage } from './pages/InsightsPage';
import { DatasetStudioPage } from './pages/DatasetStudioPage';

export function App() {
  return (
    <FilterProvider>
      <Router>
        <div className="flex h-screen bg-[#F7F5EF] overflow-hidden text-[#1A2621]">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Navbar */}
            <Navbar />

            {/* Scrollable Page Body */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/traffic" element={<TrafficAnalysisPage />} />
                  <Route path="/hotspots" element={<HotspotsPage />} />
                  <Route path="/time" element={<TimeAnalysisPage />} />
                  <Route path="/incidents" element={<IncidentsPage />} />
                  <Route path="/vehicles" element={<VehiclesPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/datasets" element={<DatasetStudioPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </Router>
    </FilterProvider>
  );
}

export default App;
