import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeader from '@components/common/SectionHeader';
import { CATEGORIES } from '@data/categories';
import { cn } from '@utils/cn';

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-100', ring: 'group-hover:ring-blue-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-100', ring: 'group-hover:ring-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'group-hover:bg-amber-100', ring: 'group-hover:ring-amber-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'group-hover:bg-pink-100', ring: 'group-hover:ring-pink-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'group-hover:bg-violet-100', ring: 'group-hover:ring-violet-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-100', ring: 'group-hover:ring-emerald-200' },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function CategoriesSection() {
  return (
    <section className="section section--gray" id="categories">
      <div className="container-app">
        <SectionHeader
          overline="CATEGORIES"
          title="Browse by service category"
          subtitle="From home repairs to tech support, find the right skilled professional for any job."
        />

        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {CATEGORIES.map(({ id, name, count, icon: Icon, color }) => {
            const theme = colorMap[color] || colorMap.blue;

            return (
              <motion.div key={id} variants={cardVariants}>
                <Link
                  to={`/workers?category=${id}`}
                  className="group block rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-lg lg:p-6"
                >
                  <div
                    className={cn(
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-0 ring-transparent transition-all duration-300 group-hover:scale-110 group-hover:ring-4',
                      theme.bg,
                      theme.text,
                      theme.hover,
                      theme.ring
                    )}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-dark transition-colors group-hover:text-primary-600">
                    {name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{count} workers</span>
                    <ArrowRight
                      size={14}
                      className="text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary-500"
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to="/workers"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary-50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100"
          >
            View All Categories
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
