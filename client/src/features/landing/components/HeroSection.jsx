import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, CheckCircle, MapPin, Clock, Shield, ArrowRight } from 'lucide-react';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import { useAuthStore } from '@store';
import { getDashboardPath } from '@utils';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const fadeScale = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function HeroSection() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const primaryCta = isAuthenticated
    ? {
        to: user?.role === 'worker' ? '/jobs' : '/workers',
        label: user?.role === 'worker' ? 'Find Work' : 'Hire a Worker',
      }
    : {
        to: '/register?role=client',
        label: 'Hire a Worker',
      };

  const secondaryCta = isAuthenticated
    ? {
        to: getDashboardPath(user?.role),
        label: 'Go to Dashboard',
      }
    : {
        to: '/register?role=worker',
        label: 'Find Work',
      };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div
        className="absolute bottom-20 right-[10%] w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse-glow pointer-events-none"
        style={{ animationDelay: '1.5s' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container-app relative z-10 py-32 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <motion.div {...fadeUp(0)}>
              <Badge color="glow" dot className="backdrop-blur-sm">
                AI-Powered Marketplace
              </Badge>
            </motion.div>

            <motion.h1
              className="mt-6 text-[clamp(36px,5vw,64px)] leading-[1.1] font-extrabold tracking-tight text-white"
              {...fadeUp(0.1)}
            >
              Find Skilled Workers.
              <br />
              <span className="gradient-text">Get Jobs Done.</span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed"
              {...fadeUp(0.2)}
            >
              Find skilled professionals instantly, powered by AI matching, real-time booking, and
              secure payments across India.
            </motion.p>

            <motion.div className="mt-8 flex flex-col sm:flex-row gap-3" {...fadeUp(0.3)}>
              <Link to={primaryCta.to}>
                <Button variant="gradient" size="xl" className="group">
                  {primaryCta.label}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to={secondaryCta.to}>
                <Button variant="outline-white" size="xl">
                  {secondaryCta.label}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2"
              {...fadeUp(0.4)}
            >
              {[
                { icon: Shield, label: 'Verified Profiles' },
                { icon: Star, label: 'AI Matching' },
                { icon: CheckCircle, label: 'Secure Payments' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-sm text-slate-400">
                  <Icon size={14} className="text-emerald-400" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div className="hidden lg:flex justify-center" {...fadeScale(0.3)}>
            <div className="relative">
              <div className="w-[300px] bg-white rounded-[36px] p-3 shadow-2xl shadow-black/20 ring-1 ring-white/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-white rounded-b-2xl z-10" />

                <div className="bg-white rounded-[28px] overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-3 pb-2">
                    <span className="text-[10px] font-semibold text-slate-900">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-1.5 bg-slate-900 rounded-sm" />
                      <div className="w-1 h-1 bg-slate-900 rounded-full" />
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <p className="text-[11px] text-slate-400">Good morning</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">Find a service</p>
                  </div>

                  <div className="mx-4 mb-4">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Search size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-400">Search for services...</span>
                    </div>
                  </div>

                  <div className="flex gap-3 px-4 mb-4 overflow-hidden">
                    {[
                      { emoji: 'Pl', label: 'Plumbing', active: true },
                      { emoji: 'El', label: 'Electric' },
                      { emoji: 'Cl', label: 'Cleaning' },
                    ].map(({ emoji, label, active }) => (
                      <div
                        key={label}
                        className={`flex flex-col items-center gap-1 ${active ? 'opacity-100' : 'opacity-60'}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${active ? 'bg-primary-50 ring-2 ring-primary-200' : 'bg-slate-50'}`}
                        >
                          {emoji}
                        </div>
                        <span
                          className={`text-[9px] font-medium ${active ? 'text-primary-600' : 'text-slate-500'}`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mx-4 mb-3 p-3 bg-gradient-to-br from-primary-50/80 to-violet-50/50 rounded-xl border border-primary-100/50">
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-semibold text-primary-600">Top Match</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-violet-400 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        VS
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900">Vikram S.</p>
                          <CheckCircle size={12} className="text-primary-500 fill-primary-100" />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span className="text-[11px] text-slate-500">4.9 (328)</span>
                          <span className="text-slate-300 mx-0.5">•</span>
                          <MapPin size={9} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500">2.3 km</span>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <span className="px-2 py-0.5 bg-white text-primary-600 text-[9px] font-semibold rounded-full">
                            Plumbing
                          </span>
                          <span className="px-2 py-0.5 bg-white text-primary-600 text-[9px] font-semibold rounded-full">
                            Repairs
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors">
                      Book Now - Rs 500/hr
                    </button>
                  </div>

                  <div className="mx-4 mb-4 p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 text-xs font-bold">
                        AP
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-slate-900">Anita P.</p>
                          <CheckCircle size={10} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          <span className="text-[10px] text-slate-500">4.8 (215)</span>
                          <span className="text-slate-300 mx-0.5">•</span>
                          <Clock size={9} className="text-slate-400" />
                          <span className="text-[10px] text-slate-500">Available now</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">Rs 450/hr</span>
                    </div>
                  </div>

                  <div className="flex justify-center pb-2">
                    <div className="w-28 h-1 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>

              <motion.div
                className="absolute -left-20 top-24 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-3 flex items-center gap-3 border border-slate-100"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center">
                  <Star size={14} className="text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-secondary-600">97% Match</span>
                  <p className="text-[10px] text-slate-400">AI Recommended</p>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-16 bottom-28 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-3 flex items-center gap-3 border border-slate-100"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600">Confirmed!</span>
                  <p className="text-[10px] text-slate-400">Booking placed</p>
                </div>
              </motion.div>

              <motion.div
                className="absolute -left-8 bottom-16 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-2.5 border border-slate-100"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary-200 ring-2 ring-white" />
                    <div className="w-5 h-5 rounded-full bg-violet-200 ring-2 ring-white" />
                    <div className="w-5 h-5 rounded-full bg-amber-200 ring-2 ring-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">50K+ workers</span>
                </div>
              </motion.div>

              <div className="absolute -inset-24 bg-primary-500/8 rounded-full blur-3xl -z-10 animate-pulse-glow" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
    </section>
  );
}
