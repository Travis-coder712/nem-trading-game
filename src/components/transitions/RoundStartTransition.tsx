/**
 * Cinematic transition that plays at the start of each bidding round.
 * Shows round number, name, season, and key market conditions.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Season } from '../../../shared/types';
import { playRoundSlam, playTitleReveal, playSeasonChime, playWipeSweep } from '../../lib/transitionAudio';

interface RoundStartTransitionProps {
  isVisible: boolean;
  roundNumber: number;
  totalRounds: number;
  roundName: string;
  season: Season;
  onComplete: () => void;
}

const SEASON_CONFIG: Record<string, { icon: string; label: string; color: string; bgGradient: string }> = {
  summer: {
    icon: '🔥',
    label: 'SUMMER',
    color: '#f56565',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, rgba(245,101,101,0.2) 0%, transparent 60%)',
  },
  autumn: {
    icon: '🍂',
    label: 'AUTUMN',
    color: '#d69e2e',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, rgba(214,158,46,0.2) 0%, transparent 60%)',
  },
  winter: {
    icon: '❄️',
    label: 'WINTER',
    color: '#63b3ed',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, rgba(99,179,237,0.2) 0%, transparent 60%)',
  },
  spring: {
    icon: '🌱',
    label: 'SPRING',
    color: '#48bb78',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, rgba(72,187,120,0.2) 0%, transparent 60%)',
  },
};

export default function RoundStartTransition({
  isVisible, roundNumber, totalRounds, roundName, season, onComplete,
}: RoundStartTransitionProps) {
  const [stage, setStage] = useState(0);
  const seasonCfg = SEASON_CONFIG[season] || SEASON_CONFIG.summer;

  useEffect(() => {
    if (!isVisible) {
      setStage(0);
      return;
    }

    // Sequence of animation stages with synchronised audio
    const timers = [
      setTimeout(() => { setStage(1); playRoundSlam(); }, 100),
      setTimeout(() => { setStage(2); playTitleReveal(); }, 700),
      setTimeout(() => { setStage(3); playSeasonChime(); }, 1300),
      setTimeout(() => { setStage(4); playWipeSweep(); }, 2500),
      setTimeout(() => onComplete(), 3100),
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
          transition={{ duration: 0.2 }}
        >
          {/* Dark background with season-colored radial glow */}
          <div className="absolute inset-0 bg-navy-950">
            <motion.div
              className="absolute inset-0"
              style={{ background: seasonCfg.bgGradient }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Diagonal sweeping bars */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-full w-1"
                style={{
                  left: `${10 + i * 20}%`,
                  background: `linear-gradient(to bottom, transparent 20%, ${seasonCfg.color}20 50%, transparent 80%)`,
                  transform: 'skewX(-15deg)',
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 0.6, 0], scaleY: [0, 1, 0] }}
                transition={{ duration: 1.8, delay: 0.15 * i, ease: 'easeInOut' }}
              />
            ))}

            {/* Bottom ticker line */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(to right, transparent, ${seasonCfg.color}, transparent)` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
          </div>

          <div className="relative z-10 text-center w-full max-w-2xl px-6">
            {/* Stage 1: Round number slams in */}
            <AnimatePresence>
              {stage >= 1 && (
                <motion.div
                  initial={{ scale: 4, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                  className="mb-2"
                >
                  <div className="text-sm font-mono uppercase tracking-[0.4em] text-navy-400 mb-2">
                    Round
                  </div>
                  <div
                    className="font-mono text-8xl md:text-9xl font-black"
                    style={{
                      color: seasonCfg.color,
                      textShadow: `0 0 80px ${seasonCfg.color}80, 0 0 160px ${seasonCfg.color}30`,
                    }}
                  >
                    {roundNumber}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage 2: Round name + divider */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5 }}
                    className="h-px mx-auto max-w-sm mb-5"
                    style={{ background: `linear-gradient(to right, transparent, ${seasonCfg.color}80, transparent)` }}
                  />
                  <h2
                    className="text-2xl md:text-3xl font-bold text-white tracking-wide"
                    style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}
                  >
                    {roundName}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage 3: Season badge + progress bar */}
            <AnimatePresence>
              {stage >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8"
                >
                  {/* Season badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border mb-6"
                    style={{
                      borderColor: `${seasonCfg.color}40`,
                      backgroundColor: `${seasonCfg.color}10`,
                    }}
                  >
                    <span className="text-xl">{seasonCfg.icon}</span>
                    <span
                      className="text-sm font-mono font-bold tracking-widest"
                      style={{ color: seasonCfg.color }}
                    >
                      {seasonCfg.label}
                    </span>
                  </motion.div>

                  {/* Progress bar */}
                  <div className="max-w-xs mx-auto">
                    <div className="flex justify-between text-[10px] font-mono text-navy-500 mb-1.5">
                      <span>ROUND {roundNumber}</span>
                      <span>OF {totalRounds}</span>
                    </div>
                    <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: seasonCfg.color }}
                        initial={{ width: `${((roundNumber - 1) / totalRounds) * 100}%` }}
                        animate={{ width: `${(roundNumber / totalRounds) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stage 4: Wipe transition — horizontal bars sweep across */}
          <AnimatePresence>
            {stage >= 4 && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`wipe-${i}`}
                    className="absolute left-0 right-0 z-50"
                    style={{
                      top: `${i * (100 / 6)}%`,
                      height: `${100 / 6 + 1}%`,
                      backgroundColor: i % 2 === 0 ? '#08101c' : '#0f1f38',
                    }}
                    initial={{ scaleX: 0, originX: i % 2 === 0 ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
