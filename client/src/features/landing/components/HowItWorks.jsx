import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeader from '@components/common/SectionHeader';
import { CLIENT_STEPS, WORKER_STEPS } from '@data/howItWorks';
import { cn } from '@utils/cn';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('clients');
  const steps = activeTab === 'clients' ? CLIENT_STEPS : WORKER_STEPS;

  return (
    <section className="section bg-white" id="how-it-works">
      <div className="container-app">
        <SectionHeader
          overline="HOW IT WORKS"
          title="Get started in minutes"
          subtitle="Whether you're hiring or looking for work, we've made it effortless."
        />

        {/* Tabs */}
        <div className="flex justify-center mb-14">
          <div className="relative inline-flex bg-slate-100 rounded-2xl p-1.5">
            {['clients', 'workers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative z-10 px-8 py-3 text-sm font-semibold rounded-xl transition-colors duration-200',
                  activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab === 'clients' ? '👤  For Clients' : '👷  For Workers'}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-primary rounded-xl -z-10 shadow-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            {/* Connecting gradient line */}
            <div className="hidden md:block absolute top-[52px] left-[16.7%] right-[16.7%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 rounded-full" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {steps.map(({ number, icon: Icon, title, description }, i) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className="relative text-center group"
                >
                  {/* Step number + icon */}
                  <div className="relative z-10 inline-flex flex-col items-center">
                    <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-3">
                      Step {number}
                    </span>
                    <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all duration-300">
                      <Icon size={28} className="text-primary-500" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-dark mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">{description}</p>

                  {/* Arrow between steps (desktop) */}
                  {i < steps.length - 1 && (
                    <ArrowRight
                      size={20}
                      className="hidden md:block absolute top-[52px] -right-2 lg:-right-4 text-primary-300"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
