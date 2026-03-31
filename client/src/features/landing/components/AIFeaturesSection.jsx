import { motion } from 'framer-motion';
import { Search, CheckCircle, TrendingUp } from 'lucide-react';
import SectionHeader from '@components/common/SectionHeader';
import { AI_FEATURES, AI_MOCK_RESULTS } from '@data/aiFeatures';
import { cn } from '@utils/cn';

const avatarColors = {
  blue: 'bg-blue-200',
  violet: 'bg-violet-200',
  amber: 'bg-amber-200',
};

const avatarInitials = {
  blue: 'RS',
  violet: 'AK',
  amber: 'PM',
};

export default function AIFeaturesSection() {
  return (
    <section className="section section--dark relative overflow-hidden" id="ai-features">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container-app relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* ── Text ── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
              <span className="overline overline--teal">AI-POWERED</span>
            </div>

            <h2 className="text-heading-1 text-white">
              Matching intelligence
              <br />
              <span className="gradient-text">that works</span>
            </h2>

            <p className="mt-5 text-lg text-slate-400 max-w-lg leading-relaxed">
              Our AI doesn't just search — it understands context, predicts quality,
              and learns from every interaction to deliver perfect matches.
            </p>

            <div className="mt-10 space-y-5">
              {AI_FEATURES.map(({ id, icon: Icon, title, description }, i) => (
                <motion.div
                  key={id}
                  className="flex gap-4 group"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                >
                  <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-secondary-500/10 flex items-center justify-center group-hover:bg-secondary-500/20 transition-colors">
                    <Icon size={20} className="text-secondary-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{title}</h4>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── AI Mockup Panel ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/20">
              {/* Titlebar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">AI Smart Match</span>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-secondary-400" />
                  <span className="text-[10px] text-secondary-400 font-semibold">Live</span>
                </div>
              </div>

              <div className="p-5">
                {/* Search input */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl mb-5 border border-white/5">
                  <Search size={14} className="text-slate-500" />
                  <span className="text-sm text-slate-300">
                    "Need a plumber for bathroom renovation"
                  </span>
                  <div className="ml-auto px-2 py-0.5 bg-secondary-500/20 rounded-md">
                    <span className="text-[10px] font-semibold text-secondary-400">AI</span>
                  </div>
                </div>

                {/* Processing indicator */}
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-secondary-400 animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-secondary-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-1 rounded-full bg-secondary-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  </div>
                  <span className="text-[11px] text-slate-500">Analyzing 2,400+ plumbers near you</span>
                </div>

                {/* Result cards */}
                <div className="space-y-3">
                  {AI_MOCK_RESULTS.map(({ name, specialty, match, color }, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.12 }}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer',
                        i === 0
                          ? 'bg-secondary-500/5 border-secondary-500/20 ring-1 ring-secondary-500/10'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold',
                        avatarColors[color],
                        color === 'blue' ? 'text-blue-700' : color === 'violet' ? 'text-violet-700' : 'text-amber-700'
                      )}>
                        {avatarInitials[color]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white">{name}</p>
                          {i === 0 && <CheckCircle size={12} className="text-secondary-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{specialty}</p>
                      </div>

                      {/* Match ring */}
                      <div className="relative w-11 h-11 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18" cy="18" r="15" fill="none"
                            stroke="rgba(20,184,166,0.1)" strokeWidth="2.5"
                          />
                          <circle
                            cx="18" cy="18" r="15" fill="none"
                            stroke={i === 0 ? '#14B8A6' : 'rgba(20,184,166,0.6)'}
                            strokeWidth="2.5"
                            strokeDasharray={`${match * 0.94} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-secondary-400">
                          {match}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer stat */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between px-1">
                  <span className="text-[11px] text-slate-500">3 of 47 matches shown</span>
                  <span className="text-[11px] font-medium text-secondary-400 cursor-pointer hover:text-secondary-300 transition-colors">
                    View all →
                  </span>
                </div>
              </div>
            </div>

            {/* Glow decorations */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-500/15 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
