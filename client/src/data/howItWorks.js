import { Search, Users, Zap, UserPlus, Lightbulb, Coins } from 'lucide-react';

/* ─────────────────────────────────────────────
   How It Works — Steps Data
   ───────────────────────────────────────────── */

export const CLIENT_STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Post Your Requirement',
    description: 'Describe what you need — our AI understands context and finds the best match.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Get AI-Matched Workers',
    description: 'Review verified profiles, ratings, and AI compatibility scores.',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Book & Pay Securely',
    description: 'Confirm booking, track progress, and pay through our secure system.',
  },
];

export const WORKER_STEPS = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Add your skills, experience, and availability. AI optimizes your profile.',
  },
  {
    number: '02',
    icon: Lightbulb,
    title: 'Get Matched to Jobs',
    description: 'Receive AI-curated job matches based on your strengths and location.',
  },
  {
    number: '03',
    icon: Coins,
    title: 'Earn & Grow',
    description: 'Complete jobs, collect payments instantly, build your reputation.',
  },
];
