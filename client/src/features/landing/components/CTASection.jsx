import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@components/common/Button';
import { useAuthStore } from '@store';
import { getDashboardPath } from '@utils';

export default function CTASection() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const hirePath = isAuthenticated
    ? user?.role === 'worker'
      ? getDashboardPath(user?.role)
      : '/workers'
    : '/register?role=client';

  const workPath = isAuthenticated
    ? user?.role === 'worker'
      ? '/jobs'
      : getDashboardPath(user?.role)
    : '/register?role=worker';

  return (
    <section className="section bg-white relative overflow-hidden" id="cta">
      <div className="container-app relative z-10">
        <motion.div
          className="relative bg-gradient-primary rounded-3xl py-16 lg:py-20 px-8 lg:px-20 text-center overflow-hidden"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full mb-6 backdrop-blur-sm border border-white/10"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={14} className="text-amber-300" />
              <span className="text-xs font-semibold text-white/90">Join 50,000+ users</span>
            </motion.div>

            <h2 className="text-heading-1 text-white max-w-xl mx-auto">Ready to get started?</h2>
            <p className="mt-4 text-lg text-white/75 max-w-lg mx-auto leading-relaxed">
              Join thousands of workers and clients building a better future with FindOne.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to={hirePath}>
                <Button
                  variant="outline-white"
                  size="xl"
                  className="bg-white text-primary-600 hover:bg-white/90 border-white font-bold group"
                >
                  Hire a Worker
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to={workPath}>
                <Button variant="outline-white" size="xl" className="group">
                  Find Work
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/60">
              {['Free to join', 'No credit card required', 'Start in 2 minutes'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
