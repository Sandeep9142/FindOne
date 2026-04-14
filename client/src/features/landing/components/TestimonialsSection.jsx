import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import SectionHeader from '@components/common/SectionHeader';
import StarRating from '@components/common/StarRating';
import { reviewService } from '@services';
import { cn } from '@utils/cn';

const avatarColors = {
  blue: 'bg-blue-100 text-blue-600',
  pink: 'bg-pink-100 text-pink-600',
  violet: 'bg-violet-100 text-violet-600',
};

const colorCycle = ['blue', 'pink', 'violet'];

const FALLBACK_TESTIMONIALS = [
  {
    id: 'demo-testimonial-1',
    quote: 'Booked an electrician in less than an hour. The worker arrived on time and fixed the issue cleanly.',
    author: 'Priyanka Das',
    role: 'Client review for Electrical',
    avatar: 'P',
    color: 'blue',
    rating: 5,
    featured: false,
  },
  {
    id: 'demo-testimonial-2',
    quote: 'As a worker, I receive clear job details and payment updates. The workflow is smooth and easy to track.',
    author: 'Raju Sharma',
    role: 'Worker feedback',
    avatar: 'R',
    color: 'pink',
    rating: 5,
    featured: true,
  },
  {
    id: 'demo-testimonial-3',
    quote: 'Great experience from booking to completion. The review and payment steps are transparent for both sides.',
    author: 'Amit Sen',
    role: 'Client review for Home Repair',
    avatar: 'A',
    color: 'violet',
    rating: 4,
    featured: false,
  },
];

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatRole(testimonial) {
  const workerName = testimonial.worker?.fullName || 'worker';
  const workerCategory = testimonial.worker?.topCategory;

  if (workerCategory) {
    return `Client review for ${workerCategory}`;
  }

  return `Client review for ${workerName}`;
}

function mapApiTestimonials(testimonials = []) {
  return testimonials.map((item, index) => ({
    id: item._id,
    quote: item.comment,
    author: item.client?.fullName || 'Client',
    role: formatRole(item),
    avatar: (item.client?.fullName || 'C').slice(0, 1).toUpperCase(),
    color: colorCycle[index % colorCycle.length],
    rating: Number(item.rating || 5),
    featured: index === 1,
  }));
}

export default function TestimonialsSection() {
  const [apiTestimonials, setApiTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadTestimonials() {
      setLoading(true);
      setError('');
      setNotice('');

      try {
        const reviews = await reviewService.getTestimonials({ limit: 6 });
        const mapped = mapApiTestimonials(reviews);
        if (mapped.length > 0) {
          setApiTestimonials(mapped);
        } else {
          setApiTestimonials(FALLBACK_TESTIMONIALS);
          setNotice('Showing sample testimonials while live review data grows.');
        }
      } catch (fetchError) {
        setApiTestimonials(FALLBACK_TESTIMONIALS);
        setNotice('Showing sample testimonials while we reconnect to live reviews.');
        setError('');
      } finally {
        setLoading(false);
      }
    }

    loadTestimonials();
  }, []);

  const testimonials = useMemo(() => apiTestimonials, [apiTestimonials]);

  return (
    <section className="section bg-white" id="testimonials">
      <div className="container-app">
        <SectionHeader
          overline="TESTIMONIALS"
          title="Loved by workers and clients"
          subtitle="Real ratings and reviews from completed bookings on FindOne."
        />

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            Loading testimonials...
          </div>
        ) : testimonials.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            No reviews yet. Complete bookings and submit ratings to show testimonials here.
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {testimonials.slice(0, 6).map(({ id, quote, author, role, avatar, color, featured, rating = 5 }) => (
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
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-4',
                    featured ? 'bg-white/10' : 'bg-primary-50'
                  )}
                >
                  <Quote size={18} className={featured ? 'text-white/60' : 'text-primary-300'} />
                </div>

                <StarRating rating={rating} size={14} />

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
        )}
      </div>
    </section>
  );
}
