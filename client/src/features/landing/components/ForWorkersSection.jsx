import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Star, TrendingUp, Wallet, MapPin, ArrowRight } from 'lucide-react';
import Button from '@components/common/Button';

const benefits = [
  'Free profile creation & AI optimization',
  'Get matched to high-paying jobs near you',
  'Instant payments — no delays',
  'Build your reputation with verified reviews',
];

export default function ForWorkersSection() {
  return (
    <section className="section bg-white" id="for-workers">
      <div className="container-app">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Visual Mockup ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative bg-gradient-to-br from-primary-50 via-violet-50 to-blue-50 rounded-3xl p-8 lg:p-10 min-h-[400px] overflow-hidden">
              {/* Worker dashboard mini-mockup */}
              <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-slate-100 overflow-hidden max-w-[320px] mx-auto">
                {/* Header */}
                <div className="bg-gradient-primary px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">RS</div>
                    <div>
                      <p className="text-sm font-semibold text-white">Rajesh S.</p>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="fill-amber-300 text-amber-300" />
                        <span className="text-[11px] text-white/80">4.9 · Plumber</span>
                      </div>
                    </div>
                    <CheckCircle size={16} className="ml-auto text-emerald-300" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  {[
                    { val: '₹45K', label: 'This Month' },
                    { val: '328', label: 'Jobs Done' },
                    { val: '4.9', label: 'Rating' },
                  ].map(({ val, label }) => (
                    <div key={label} className="py-3 text-center">
                      <p className="text-sm font-bold text-dark">{val}</p>
                      <p className="text-[9px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Current job card */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Active Job</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-slate-900">Bathroom Pipe Repair</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin size={9} /> 2.3 km
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Wallet size={9} /> ₹1,200
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -left-3 lg:-left-6 bottom-20 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-3 border border-slate-100"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">₹45,000</p>
                    <p className="text-[10px] text-slate-400">/month avg.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-2 lg:-right-5 top-20 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-2.5 flex items-center gap-2 border border-slate-100"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              >
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-dark">4.9</span>
                <span className="text-[10px] text-slate-400">rating</span>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Text Content ── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="overline">FOR WORKERS</span>
            <h2 className="mt-4 text-heading-1 text-dark">
              Your skills deserve
              <br />
              <span className="gradient-text">better pay</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-md leading-relaxed">
              Join 50,000+ workers who've transformed their income with FindOne.
              No middlemen, no commission cuts, just fair work.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <CheckCircle size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/jobs" className="inline-block mt-8">
              <Button variant="primary" size="lg" className="group">
                Start Earning Today
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
