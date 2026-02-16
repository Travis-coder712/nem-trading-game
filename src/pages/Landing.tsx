import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleGrid from '../components/landing/ParticleGrid';
import PhotoCarousel from '../components/landing/PhotoCarousel';
import EnergyTicker from '../components/landing/EnergyTicker';
import AudioController from '../components/landing/AudioController';
import StatsCounter from '../components/landing/StatsCounter';
import EducationalSlideDeck from '../components/landing/EducationalSlideDeck';

export default function Landing() {
  const navigate = useNavigate();
  const [slideDeckOpen, setSlideDeckOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-navy-950">
      {/* Layer 0: Particle network */}
      <ParticleGrid />

      {/* Layer 1: Photo carousel (low opacity background) */}
      <PhotoCarousel />

      {/* Layer 2: Scrolling news ticker */}
      <EnergyTicker />

      {/* Layer 3: Main content */}
      <div className="relative z-[5] min-h-screen flex flex-col items-center justify-center px-4 pt-12 pb-8">
        <div className="max-w-2xl w-full text-center">

          {/* Animated Lightning Bolt */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-4"
          >
            <div className="inline-block glow-pulse">
              <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20 mx-auto" fill="none">
                <path
                  d="M38 4L14 36h14l-4 24 24-32H34l4-24z"
                  fill="url(#bolt-gradient)"
                  stroke="rgba(71,167,255,0.5)"
                  strokeWidth="1"
                />
                <defs>
                  <linearGradient id="bolt-gradient" x1="14" y1="4" x2="48" y2="60">
                    <stop offset="0%" stopColor="#75bdff" />
                    <stop offset="100%" stopColor="#3182ce" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Title - Terminal / Bloomberg style */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-mono text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-widest mb-1"
            style={{ textShadow: '0 0 40px rgba(71, 167, 255, 0.3), 0 0 80px rgba(71, 167, 255, 0.1)' }}
          >
            NEM MERIT ORDER
          </motion.h1>

          {/* Subtitle with staggered letter reveal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-4"
          >
            <h2 className="text-xl md:text-3xl font-medium text-electric-300 tracking-[0.3em] font-mono">
              {'TRAINING GAME'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.04, duration: 0.3 }}
                >
                  {char}
                </motion.span>
              ))}
            </h2>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="text-navy-300 text-sm md:text-base max-w-lg mx-auto mb-10"
          >
            Master Australia's National Electricity Market through live
            bidding simulation. Experience the energy transition firsthand.
          </motion.p>

          {/* Primary action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-6"
          >
            <motion.button
              onClick={() => navigate('/host')}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/15 hover:border-electric-400 rounded-2xl p-6 transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="shimmer-overlay" />
              <div className="relative z-10">
                <svg className="w-8 h-8 mx-auto mb-3 text-electric-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
                <div className="text-lg font-bold text-white mb-1">Host Game</div>
                <div className="text-xs text-navy-300">
                  Set up and control from your laptop
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => navigate('/team/join')}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/15 hover:border-electric-400 rounded-2xl p-6 transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="shimmer-overlay" />
              <div className="relative z-10">
                <svg className="w-8 h-8 mx-auto mb-3 text-electric-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                <div className="text-lg font-bold text-white mb-1">Join Team</div>
                <div className="text-xs text-navy-300">
                  Enter bids from your phone
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Secondary buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-10"
          >
            <button
              onClick={() => setSlideDeckOpen(true)}
              className="px-5 py-2.5 text-sm font-medium text-electric-300 border border-electric-500/30 hover:border-electric-400 hover:bg-electric-500/10 rounded-xl transition-all"
            >
              📚 Learn the NEM
            </button>
            <a
              href="/api/pre-read"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm font-medium text-electric-300 border border-electric-500/30 hover:border-electric-400 hover:bg-electric-500/10 rounded-xl transition-all"
            >
              📖 Player Pre-Read
            </a>
            <a
              href="/guide"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm font-medium text-navy-300 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-xl transition-all"
            >
              📄 Download Guide
            </a>
          </motion.div>

          {/* Animated stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.8 }}
          >
            <StatsCounter />
          </motion.div>

          {/* Footer tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.8 }}
            className="mt-10 text-navy-500 text-xs"
          >
            Up to 15 teams &bull; 3 game modes &bull; Real NEM scenarios &bull; Coal to batteries
          </motion.p>
        </div>
      </div>

      {/* Layer 4: Audio controller */}
      <AudioController />

      {/* Educational slide deck modal */}
      <EducationalSlideDeck
        isOpen={slideDeckOpen}
        onClose={() => setSlideDeckOpen(false)}
      />
    </div>
  );
}
