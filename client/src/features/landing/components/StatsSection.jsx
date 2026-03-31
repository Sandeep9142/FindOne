import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { STATS } from '@data/stats';

/* ── Animated number counter ── */
function AnimatedValue({ value, inView }) {
  const [display, setDisplay] = useState(value);
  const numericMatch = value.match(/^([\d,.]+)/);

  useEffect(() => {
    if (!inView || !numericMatch) return;

    const target = parseFloat(numericMatch[1].replace(/,/g, ''));
    const suffix = value.replace(numericMatch[1], '');
    const duration = 1800;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      const formatted = target >= 100
        ? current.toLocaleString('en-IN')
        : target % 1 !== 0
          ? (eased * target).toFixed(1)
          : current.toString();

      setDisplay(formatted + suffix);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [inView, value, numericMatch]);

  return <>{display}</>;
}

export default function StatsSection() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden" id="stats" ref={ref}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark via-slate-900 to-dark" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container-app relative z-10 py-16 lg:py-20">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {STATS.map(({ id, value, label }, i) => (
            <div
              key={id}
              className={`text-center px-6 ${i > 0 ? 'lg:border-l lg:border-white/10' : ''}`}
            >
              <span className="block text-3xl lg:text-5xl font-extrabold text-white tracking-tight">
                <AnimatedValue value={value} inView={inView} />
              </span>
              <span className="block mt-2 text-sm text-slate-400 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Decorative gradient blurs */}
      <div className="absolute top-0 left-[20%] w-64 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-[20%] w-64 h-32 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
