import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';

const GAME_MODES = [
  {
    id: 'beginner',
    name: 'Beginner Intro',
    rounds: 1,
    duration: '10-15 min',
    description: 'One guided round with 2 assets (coal + gas). Perfect for first-timers who\'ve never seen an electricity market.',
    icon: '🎓',
  },
  {
    id: 'quick',
    name: 'Quick Game',
    rounds: 8,
    duration: '60-90 min',
    description: 'Compressed version covering all key concepts. Great for time-limited workshops.',
    icon: '⚡',
  },
  {
    id: 'full',
    name: 'Full Game',
    rounds: 15,
    duration: '2.5-3.5 hours',
    description: 'Complete learning journey from coal basics to full NEM simulation with all scenarios.',
    icon: '🏆',
  },
  {
    id: 'experienced',
    name: 'Experienced Replay',
    rounds: 4,
    duration: '30-45 min',
    description: 'One round per season with full portfolio. For participants who want to try different strategies.',
    icon: '🔄',
  },
];

export default function GameSetup() {
  const navigate = useNavigate();
  const { createGame, gameState, connected } = useSocket();
  const [selectedMode, setSelectedMode] = useState('beginner');
  const [teamCount, setTeamCount] = useState(6);
  const [balancingEnabled, setBalancingEnabled] = useState(true);

  useEffect(() => {
    if (gameState && gameState.phase === 'lobby') {
      navigate('/host/dashboard');
    }
  }, [gameState, navigate]);

  const handleCreate = () => {
    createGame(selectedMode, teamCount, balancingEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-start mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Exit
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">⚡ Game Setup</h1>
          <p className="text-navy-300">Configure your NEM Merit Order training session</p>
          <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium ${
            connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Server Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-navy-200 mb-3">Game Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {GAME_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`relative text-left rounded-xl p-4 border-2 transition-all duration-200 ${
                  selectedMode === mode.id
                    ? 'border-electric-400 bg-electric-500/10 shadow-lg shadow-electric-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-2">{mode.icon}</div>
                <div className="font-semibold text-white text-sm">{mode.name}</div>
                <div className="text-xs text-electric-300 mb-1">{mode.rounds} rounds &bull; {mode.duration}</div>
                <div className="text-xs text-navy-400">{mode.description}</div>
                {selectedMode === mode.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-electric-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Team Count */}
        <div className="mb-6 bg-white/5 rounded-xl p-5 border border-white/10">
          <label className="block text-sm font-medium text-navy-200 mb-3">
            Number of Teams: <span className="text-electric-400 font-bold text-lg">{teamCount}</span>
          </label>
          <input
            type="range"
            min="2"
            max="15"
            value={teamCount}
            onChange={(e) => setTeamCount(parseInt(e.target.value))}
            className="w-full h-2 bg-navy-600 rounded-lg appearance-none cursor-pointer accent-electric-500"
          />
          <div className="flex justify-between text-xs text-navy-500 mt-1">
            <span>2 teams</span>
            <span>15 teams</span>
          </div>
        </div>

        {/* Balancing Toggle */}
        <div className="mb-8 bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-navy-200">Catch-Up Mechanic</div>
              <div className="text-xs text-navy-400 mt-1">
                Leading teams may experience "plant failures" to keep the game competitive
              </div>
            </div>
            <button
              onClick={() => setBalancingEnabled(!balancingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                balancingEnabled ? 'bg-electric-500' : 'bg-navy-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                balancingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!connected}
          className="w-full py-4 bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-400 hover:to-electric-500 text-white font-bold text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-electric-500/30 hover:shadow-electric-500/50"
        >
          Create Game
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-2 text-navy-400 hover:text-white text-sm transition-colors"
        >
          &larr; Back to Home
        </button>
      </div>
    </div>
  );
}
