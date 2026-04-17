import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { STATS } from '@data/stats';

function getValueParts(value) {
  const match = String(value).match(/^([\d,.]+)(.*)$/);

  if (!match) {
    return { target: null, suffix: '', hasDecimal: false };
  }

  return {
    target: Number(match[1].replace(/,/g, '')),
    suffix: match[2] || '',
    hasDecimal: match[1].includes('.'),
  };
}

function formatCounterValue(value, hasDecimal) {
  if (hasDecimal) {
    return value.toFixed(1);
  }

  return Math.round(value).toLocaleString('en-IN');
}

function AnimatedValue({ value, active }) {
  const { target, suffix, hasDecimal } = getValueParts(value);
  const startValue = target === null ? value : `${hasDecimal ? '1.0' : '1'}${suffix}`;
  const [display, setDisplay] = useState(startValue);

  useEffect(() => {
    if (target === null) {
      setDisplay(value);
      return undefined;
    }

    if (!active) {
      setDisplay(startValue);
      return undefined;
    }

    let frameId = 0;
    const from = 1;
    const duration = 1500;
    const startedAt = performance.now();

    function animate(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;

      setDisplay(`${formatCounterValue(current, hasDecimal)}${suffix}`);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [active, hasDecimal, startValue, suffix, target, value]);

  return <>{display}</>;
}

/* ── Animated number counter ── */
export default function StatsSection() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

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
                <AnimatedValue value={value} active={inView} />
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
