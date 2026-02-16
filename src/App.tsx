import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import GameSetup from './pages/host/GameSetup';
import HostDashboard from './pages/host/HostDashboard';
import TeamJoin from './pages/team/TeamJoin';
import TeamGame from './pages/team/TeamGame';
import GameGuide from './pages/presentation/GameGuide';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/host" element={<GameSetup />} />
      <Route path="/host/dashboard" element={<HostDashboard />} />
      <Route path="/team/join" element={<TeamJoin />} />
      <Route path="/team/game" element={<TeamGame />} />
      <Route path="/guide" element={<GameGuide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
