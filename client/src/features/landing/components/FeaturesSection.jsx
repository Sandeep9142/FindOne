import { motion } from 'framer-motion';
import SectionHeader from '@components/common/SectionHeader';
import { FEATURES } from '@data/features';
import { cn } from '@utils/cn';

const iconColorMap = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'group-hover:ring-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'group-hover:ring-amber-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'group-hover:ring-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'group-hover:ring-red-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'group-hover:ring-violet-100' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'group-hover:ring-teal-100' },
};

export default function FeaturesSection() {
  return (
    <section className="section bg-white" id="features">
      <div className="container-app">
        <SectionHeader
          overline="WHY FINDONE"
          title="Built different. Built better."
          subtitle="Every detail designed to make hiring and working seamless."
        />

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {FEATURES.map(({ id, icon: Icon, color, title, description }) => {
            const c = iconColorMap[color] || iconColorMap.blue;
            return (
              <motion.div
                key={id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                className="group relative bg-white border border-slate-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 overflow-hidden"
              >
                {/* Subtle gradient accent on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/0 group-hover:from-slate-50/80 group-hover:to-white transition-all duration-300 -z-0" />

                <div className="relative z-10">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ring-0 ring-transparent transition-all duration-300 group-hover:ring-4',
                      c.bg, c.text, c.ring
                    )}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-dark mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
