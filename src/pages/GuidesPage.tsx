import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GuideLink {
  emoji: string;
  title: string;
  description: string;
  href: string;
  isExternal: boolean;
  color: string;
  borderColor: string;
  hoverBorderColor: string;
  hoverBg: string;
}

const playerGuides: GuideLink[] = [
  {
    emoji: '📖',
    title: 'Player Pre-Read',
    description: 'Send to participants before the session. Covers the NEM, merit order, generator types, bidding strategies, scenarios, and glossary — all in one document.',
    href: '/api/pre-read',
    isExternal: true,
    color: 'text-electric-300',
    borderColor: 'border-electric-500/30',
    hoverBorderColor: 'hover:border-electric-400',
    hoverBg: 'hover:bg-electric-500/10',
  },
  {
    emoji: '📄',
    title: 'Quick Reference Guide',
    description: 'Printable reference with asset specs, bidding rules, strategies, annotated bidding walkthrough, time periods, and guardrails.',
    href: '/guide',
    isExternal: true,
    color: 'text-navy-300',
    borderColor: 'border-white/10',
    hoverBorderColor: 'hover:border-white/30',
    hoverBg: 'hover:bg-white/5',
  },
  {
    emoji: '🎓',
    title: 'Educational Compendium',
    description: 'Post-game take-home reference. All educational content from every round, organised by topic — NEM basics, generator types, strategies, scenarios, and the energy transition.',
    href: '/api/educational-compendium',
    isExternal: true,
    color: 'text-electric-300',
    borderColor: 'border-electric-500/30',
    hoverBorderColor: 'hover:border-electric-400',
    hoverBg: 'hover:bg-electric-500/10',
  },
];

const hostGuides: GuideLink[] = [
  {
    emoji: '🎯',
    title: 'Game Master\'s Guide',
    description: 'Everything you need to run a great session — round-by-round walkthroughs for all 6 game modes, facilitation techniques, teaching notes, and tips for success.',
    href: '/api/game-master-guide',
    isExternal: true,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    hoverBorderColor: 'hover:border-amber-400',
    hoverBg: 'hover:bg-amber-500/10',
  },
  {
    emoji: '🎮',
    title: 'Gameplay Mechanics',
    description: 'Detailed behind-the-scenes reference — merit order dispatch, pricing, profit formulas, battery/hydro mechanics, scenarios, and round-by-round configurations.',
    href: '/api/gameplay-summary',
    isExternal: true,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    hoverBorderColor: 'hover:border-amber-400',
    hoverBg: 'hover:bg-amber-500/10',
  },
];

const devGuides: GuideLink[] = [
  {
    emoji: '✨',
    title: 'How This Was Built (Vibe Coding)',
    description: 'A non-technical guide explaining how the game was built using AI-assisted "vibe coding" with Claude Code.',
    href: '/api/notes/vibe-coding',
    isExternal: true,
    color: 'text-purple-300',
    borderColor: 'border-purple-500/25',
    hoverBorderColor: 'hover:border-purple-400',
    hoverBg: 'hover:bg-purple-500/10',
  },
  {
    emoji: '🔧',
    title: 'Technical Notes (IT Teams)',
    description: 'Architecture overview, tech stack, deployment instructions, and infrastructure notes for IT teams.',
    href: '/api/notes/technical',
    isExternal: true,
    color: 'text-purple-300',
    borderColor: 'border-purple-500/25',
    hoverBorderColor: 'hover:border-purple-400',
    hoverBg: 'hover:bg-purple-500/10',
  },
  {
    emoji: '🚀',
    title: 'Recommended Further Improvements',
    description: 'Prioritised roadmap of potential enhancements, ranked by impact and desirability.',
    href: '/api/recommended-improvements',
    isExternal: true,
    color: 'text-green-300',
    borderColor: 'border-green-500/30',
    hoverBorderColor: 'hover:border-green-400',
    hoverBg: 'hover:bg-green-500/10',
  },
];

const toolsLinks: GuideLink[] = [
  {
    emoji: '🎬',
    title: 'Watch Trailer',
    description: 'Cinematic trailer introducing GridRival — great for building excitement before a session.',
    href: '/api/trailer',
    isExternal: false,
    color: 'text-electric-300',
    borderColor: 'border-electric-500/25',
    hoverBorderColor: 'hover:border-electric-400',
    hoverBg: 'hover:bg-electric-500/10',
  },
  {
    emoji: '🔋',
    title: 'Battery Mini-Game',
    description: 'Standalone battery arbitrage practice game — charge/discharge across a 24-hour price curve.',
    href: '/battery-test',
    isExternal: false,
    color: 'text-lime-300',
    borderColor: 'border-lime-500/25',
    hoverBorderColor: 'hover:border-lime-400',
    hoverBg: 'hover:bg-lime-500/10',
  },
];

function GuideCard({ guide }: { guide: GuideLink }) {
  const navigate = useNavigate();

  if (guide.isExternal || guide.href.startsWith('/api/')) {
    return (
      <a
        href={guide.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${guide.color} border ${guide.borderColor} ${guide.hoverBorderColor} ${guide.hoverBg} rounded-xl p-4 transition-all group`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{guide.emoji}</span>
          <div>
            <div className="font-semibold text-sm group-hover:underline">{guide.title}</div>
            <div className="text-xs text-navy-400 mt-1 leading-relaxed">{guide.description}</div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <button
      onClick={() => navigate(guide.href)}
      className={`block w-full text-left ${guide.color} border ${guide.borderColor} ${guide.hoverBorderColor} ${guide.hoverBg} rounded-xl p-4 transition-all group`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{guide.emoji}</span>
        <div>
          <div className="font-semibold text-sm group-hover:underline">{guide.title}</div>
          <div className="text-xs text-navy-400 mt-1 leading-relaxed">{guide.description}</div>
        </div>
      </div>
    </button>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="text-xs text-navy-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

export default function GuidesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-navy-900/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-electric-400 hover:text-electric-300 text-sm font-medium transition-colors"
          >
            ← Back to Home
          </button>
          <span className="text-navy-400 text-xs">GridRival Guides & Resources</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="text-3xl mb-2">📚</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Guides & Background</h1>
          <p className="text-navy-300 text-sm mt-2 max-w-md mx-auto">
            Everything you need to prepare for, run, and understand GridRival — from player pre-reads to technical documentation.
          </p>
        </motion.div>

        {/* Player Guides */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <SectionHeading
            title="📖 Player Guides"
            subtitle="Educational content for participants — distribute before, during, or after the session"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playerGuides.map((guide) => (
              <GuideCard key={guide.title} guide={guide} />
            ))}
          </div>
        </motion.div>

        {/* Host / Game Master */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <SectionHeading
            title="🎯 Host / Game Master"
            subtitle="Facilitation guides with round-by-round walkthroughs, teaching notes, and detailed mechanics"
          />
          <div className="grid grid-cols-1 gap-3">
            {hostGuides.map((guide) => (
              <GuideCard key={guide.title} guide={guide} />
            ))}
          </div>
        </motion.div>

        {/* Tools & Extras */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-8"
        >
          <SectionHeading
            title="🛠 Tools & Extras"
            subtitle="Interactive tools and media"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {toolsLinks.map((guide) => (
              <GuideCard key={guide.title} guide={guide} />
            ))}
          </div>
        </motion.div>

        {/* Development Notes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-8"
        >
          <SectionHeading
            title="💻 Development & Technical"
            subtitle="How the game was built, architecture notes, and improvement roadmap"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devGuides.map((guide) => (
              <GuideCard key={guide.title} guide={guide} />
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12 pt-6 border-t border-white/10">
          <p className="text-navy-500 text-xs">
            GridRival — 6 game modes &bull; 7 asset types &bull; 6 bidding strategies &bull; Real NEM scenarios
          </p>
        </div>
      </div>
    </div>
  );
}
