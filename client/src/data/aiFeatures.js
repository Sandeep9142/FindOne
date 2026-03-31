import { Lightbulb, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';

/* ─────────────────────────────────────────────
   AI Features Data
   ───────────────────────────────────────────── */

export const AI_FEATURES = [
  {
    id: 'smart-matching',
    icon: Lightbulb,
    title: 'Smart Matching',
    description: 'AI analyzes 50+ data points to find the perfect worker for your specific need.',
  },
  {
    id: 'dynamic-pricing',
    icon: TrendingUp,
    title: 'Dynamic Pricing',
    description: 'Fair, market-driven pricing suggestions powered by real-time supply and demand.',
  },
  {
    id: 'nlp-posting',
    icon: MessageSquare,
    title: 'NLP Job Posting',
    description: 'Just describe what you need in plain language — our AI handles the rest.',
  },
  {
    id: 'performance',
    icon: BarChart3,
    title: 'Performance Insights',
    description: 'Workers get AI-driven tips to improve their profiles, skills, and earnings.',
  },
];

export const AI_MOCK_RESULTS = [
  { name: 'Suresh M.', specialty: 'Plumbing Expert · 8yr exp', match: 97, color: 'blue' },
  { name: 'Karan P.', specialty: 'Plumber · 5yr exp', match: 94, color: 'violet' },
  { name: 'Deepak R.', specialty: 'Plumbing & Fitting · 6yr exp', match: 91, color: 'amber' },
];
