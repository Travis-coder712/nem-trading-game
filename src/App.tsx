import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Eagerly load the landing page (first paint)
import Landing from './pages/Landing';

// Lazy-load heavy route components for code splitting (Improvement 5.6)
const GameSetup = lazy(() => import('./pages/host/GameSetup'));
const HostDashboard = lazy(() => import('./pages/host/HostDashboard'));
const TeamJoin = lazy(() => import('./pages/team/TeamJoin'));
const TeamGame = lazy(() => import('./pages/team/TeamGame'));
const GameGuide = lazy(() => import('./pages/presentation/GameGuide'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const SpectatorView = lazy(() => import('./pages/spectator/SpectatorView'));
const PostGameReport = lazy(() => import('./pages/report/PostGameReport'));
const BatteryTest = lazy(() => import('./pages/BatteryTest'));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-spin">⚡</div>
        <div className="text-sm text-gray-500 font-medium">Loading...</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<GameSetup />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/team/join" element={<TeamJoin />} />
        <Route path="/team/game" element={<TeamGame />} />
        <Route path="/guide" element={<GameGuide />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/spectate" element={<SpectatorView />} />
        <Route path="/report" element={<PostGameReport />} />
        <Route path="/battery-test" element={<BatteryTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
