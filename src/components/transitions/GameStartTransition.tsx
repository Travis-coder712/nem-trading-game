/**
 * Cinematic transition that plays when the host starts the game.
 * Full-screen overlay with dramatic energy-market themed animation.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playBoltZap, playTitleBoom, playStatPing, playFlashWhoosh } from '../../lib/transitionAudio';

interface GameStartTransitionProps {
  isVisible: boolean;
  teamCount: number;
  totalRounds: number;
  onComplete: () => void;
}

function getModeLabel(totalRounds: number): string {
  if (totalRounds <= 1) return 'Beginner Intro';
  if (totalRounds <= 4) return 'Experienced Replay';
  if (totalRounds <= 8) return 'Quick Game';
  return 'Full Simulation';
}

export default function GameStartTransition({ isVisible, teamCount, totalRounds, onComplete }: GameStartTransitionProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setStage(0);
      return;
    }

    // Sequence of animation stages with synchronised audio
    const timers = [
      setTimeout(() => { setStage(1); playBoltZap(); }, 100),
      setTimeout(() => { setStage(2); playTitleBoom(); }, 800),
      setTimeout(() => { setStage(3); playStatPing(0); }, 1600),
      setTimeout(() => playStatPing(1), 1750),
      setTimeout(() => playStatPing(2), 1900),
      setTimeout(() => { setStage(4); playFlashWhoosh(); }, 2800),
      setTimeout(() => onComplete(), 3400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated dark background with moving grid */}
          <div className="absolute inset-0 bg-navy-950">
            {/* Radial pulse from center */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(49,130,206,0.15) 0%, transparent 60%)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Horizontal scanning lines */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-0 right-0 h-px bg-electric-500/20"
                style={{ top: `${12 + i * 12}%` }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.5, delay: 0.1 * i, ease: 'easeOut' }}
              />
            ))}

            {/* Vertical energy pulse lines */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${15 + i * 14}%`,
                  background: 'linear-gradient(to bottom, transparent, rgba(71,167,255,0.3), transparent)',
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 0.5, 0], scaleY: [0, 1, 0] }}
                transition={{ duration: 2, delay: 0.3 + i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Stage 1: Lightning bolt appears with electric flash */}
          <div className="relative z-10 text-center">
            <AnimatePresence>
              {stage >= 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="mb-6"
                >
                  <div className="relative inline-block">
                    {/* Glow ring behind bolt */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(71,167,255,0.4) 0%, transparent 70%)',
                        width: '200px',
                        height: '200px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <svg viewBox="0 0 64 64" className="w-24 h-24 md:w-32 md:h-32 mx-auto relative" fill="none">
                      <motion.path
                        d="M38 4L14 36h14l-4 24 24-32H34l4-24z"
                        fill="url(#start-bolt-gradient)"
                        stroke="rgba(71,167,255,0.8)"
                        strokeWidth="1.5"
                        initial={{ pathLength: 0, fillOpacity: 0 }}
                        animate={{ pathLength: 1, fillOpacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="start-bolt-gradient" x1="14" y1="4" x2="48" y2="60">
                          <stop offset="0%" stopColor="#75bdff" />
                          <stop offset="50%" stopColor="#47a7ff" />
                          <stop offset="100%" stopColor="#3182ce" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage 2: Title and mode */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                >
                  <h1
                    className="font-mono text-5xl md:text-7xl font-extrabold text-white tracking-wider mb-2"
                    style={{ textShadow: '0 0 60px rgba(71,167,255,0.5), 0 0 120px rgba(71,167,255,0.2)' }}
                  >
                    MARKET OPEN
                  </h1>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-0.5 bg-gradient-to-r from-transparent via-electric-400 to-transparent mx-auto max-w-md mb-4"
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-electric-300 text-lg md:text-xl font-medium tracking-widest"
                  >
                    {getModeLabel(totalRounds)}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage 3: Team count and stats */}
            <AnimatePresence>
              {stage >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 flex items-center justify-center gap-8"
                >
                  {[
                    { value: teamCount, label: 'Teams' },
                    { value: '5', label: 'Regions' },
                    { value: 'NEM', label: 'Market' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.15, type: 'spring', stiffness: 150 }}
                      className="text-center"
                    >
                      <div className="text-3xl md:text-4xl font-mono font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-navy-400 uppercase tracking-widest mt-1">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stage 4: Flash white and fade out */}
          <AnimatePresence>
            {stage >= 4 && (
              <motion.div
                className="absolute inset-0 bg-white z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.6, times: [0, 0.3, 1] }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
