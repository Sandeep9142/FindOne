import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import SectionHeader from '@components/common/SectionHeader';
import StarRating from '@components/common/StarRating';
import { TESTIMONIALS } from '@data/testimonials';
import { cn } from '@utils/cn';

const avatarColors = {
  blue: 'bg-blue-100 text-blue-600',
  pink: 'bg-pink-100 text-pink-600',
  violet: 'bg-violet-100 text-violet-600',
};

export default function TestimonialsSection() {
  return (
    <section className="section bg-white" id="testimonials">
      <div className="container-app">
        <SectionHeader
          overline="TESTIMONIALS"
          title="Loved by workers and clients"
          subtitle="Don't take our word for it — hear from the people who use FindOne every day."
        />

        <motion.div
          className="grid md:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {TESTIMONIALS.map(({ id, quote, author, role, avatar, color, featured }) => (
            <motion.div
              key={id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className={cn(
                'relative rounded-2xl p-6 lg:p-7 transition-all duration-300 group',
                featured
                  ? 'bg-gradient-primary text-white shadow-primary md:-translate-y-2'
                  : 'bg-white border border-slate-100 hover:shadow-lg hover:-translate-y-1 hover:border-slate-200'
              )}
            >
              {/* Quote icon */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-4',
                featured ? 'bg-white/10' : 'bg-primary-50'
              )}>
                <Quote size={18} className={featured ? 'text-white/60' : 'text-primary-300'} />
              </div>

              <StarRating rating={5} size={14} />

              <p
                className={cn(
                  'mt-4 text-sm leading-relaxed',
                  featured ? 'text-white/90' : 'text-slate-600'
                )}
              >
                "{quote}"
              </p>

              <div className={cn('my-5 h-px', featured ? 'bg-white/15' : 'bg-slate-100')} />

              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold',
                    featured ? 'bg-white/15 text-white ring-2 ring-white/20' : cn(avatarColors[color], 'ring-2 ring-slate-50')
                  )}
                >
                  {avatar}
                </div>
                <div>
                  <p className={cn('text-sm font-bold', featured ? 'text-white' : 'text-dark')}>
                    {author}
                  </p>
                  <p className={cn('text-xs', featured ? 'text-white/60' : 'text-slate-400')}>
                    {role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
