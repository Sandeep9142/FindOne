import { motion } from 'framer-motion';
import { Users, MapPin, Briefcase, Star } from 'lucide-react';

const metrics = [
  { icon: Users, value: '50,000+', label: 'Active Workers' },
  { icon: MapPin, value: '100+', label: 'Cities' },
  { icon: Briefcase, value: '200K+', label: 'Jobs Done' },
  { icon: Star, value: '4.8', label: 'Avg. Rating' },
];

const partners = ['Economic Times', 'YourStory', 'Inc42', 'TechCrunch', 'Mint', 'Startup India'];

export default function TrustBar() {
  return (
    <div className="relative bg-white border-t border-b border-slate-100">
      {/* Quick stats strip */}
      <div className="container-app py-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-100"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {metrics.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center justify-center gap-3 px-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-dark leading-none">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Featured-in strip */}
      <div className="border-t border-slate-100 bg-slate-50/50 py-5">
        <div className="container-app">
          <p className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-4">
            As Featured In
          </p>
          <div className="overflow-hidden relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50/80 to-transparent z-10 pointer-events-none" />

            <div className="flex animate-scroll-x gap-16 whitespace-nowrap">
              {[...partners, ...partners, ...partners].map((name, i) => (
                <span
                  key={i}
                  className="text-base font-bold text-slate-300 select-none tracking-wide"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
