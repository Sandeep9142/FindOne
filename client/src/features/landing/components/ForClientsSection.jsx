import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Clock, Shield, MapPin, ArrowRight } from 'lucide-react';
import Button from '@components/common/Button';

const benefits = [
  'AI-powered worker matching',
  'Verified & background-checked workers',
  'Transparent pricing, no hidden fees',
  'Real-time tracking & secure payments',
];

export default function ForClientsSection() {
  return (
    <section className="section section--gray" id="for-clients">
      <div className="container-app">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Text Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="overline">FOR CLIENTS</span>
            <h2 className="mt-4 text-heading-1 text-dark">
              Hire with
              <br />
              <span className="gradient-text">confidence</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-md leading-relaxed">
              Stop guessing. Our AI finds, verifies, and matches the ideal worker for
              your needs — in minutes, not days.
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

            <Link to="/workers" className="inline-block mt-8">
              <Button variant="gradient" size="lg" className="group">
                Post a Job Free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* ── Visual Mockup ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="relative bg-gradient-to-br from-violet-50 via-primary-50 to-blue-50 rounded-3xl p-8 lg:p-10 min-h-[400px] overflow-hidden">
              {/* Job posting mockup */}
              <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-slate-100 overflow-hidden max-w-[320px] mx-auto">
                {/* Job header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide">Finding matches</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark">Bathroom Renovation</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin size={9} /> Bengaluru
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={9} /> 2 hrs ago
                    </span>
                  </div>
                </div>

                {/* Matched workers */}
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Top Matches</p>

                  {[
                    { name: 'Vikram S.', rating: '4.9', match: '97%', initials: 'VS', color: 'bg-primary-100 text-primary-600' },
                    { name: 'Suresh K.', rating: '4.8', match: '94%', initials: 'SK', color: 'bg-violet-100 text-violet-600' },
                  ].map((w) => (
                    <div key={w.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className={`w-8 h-8 rounded-full ${w.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                        {w.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-slate-900">{w.name}</p>
                          <Shield size={10} className="text-primary-500" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={8} className="fill-amber-400 text-amber-400" />
                          <span className="text-[10px] text-slate-500">{w.rating}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-full">{w.match}</span>
                    </div>
                  ))}

                  <button className="w-full py-2 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors">
                    View All 12 Matches
                  </button>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -right-2 lg:-right-5 bottom-20 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-3 flex items-center gap-2 border border-slate-100"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600">Confirmed</span>
                  <p className="text-[9px] text-slate-400">Booking placed</p>
                </div>
              </motion.div>

              <motion.div
                className="absolute -left-2 lg:-left-5 top-20 bg-white rounded-2xl shadow-xl shadow-black/8 px-4 py-2.5 border border-slate-100"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                <span className="text-xs font-bold text-slate-700">
                  AI Match: <span className="text-secondary-600">97%</span>
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
