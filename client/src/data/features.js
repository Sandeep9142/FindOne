import {
  ShieldCheck,
  Star,
  CreditCard,
  MapPin,
  Clock,
  Headphones,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Platform Features
   ───────────────────────────────────────────── */

export const FEATURES = [
  {
    id: 'verified',
    icon: ShieldCheck,
    color: 'green',
    title: 'Verified Profiles',
    description:
      'Every worker is background-checked and skill-verified before they appear on the platform.',
  },
  {
    id: 'ratings',
    icon: Star,
    color: 'amber',
    title: 'Ratings & Reviews',
    description:
      'Transparent rating system so you always know who you\'re hiring. Real feedback from real clients.',
  },
  {
    id: 'payments',
    icon: CreditCard,
    color: 'blue',
    title: 'Secure Payments',
    description:
      'Escrow-protected payments. Workers get paid on time, clients pay only for completed work.',
  },
  {
    id: 'hyperlocal',
    icon: MapPin,
    color: 'red',
    title: 'Hyperlocal Matching',
    description:
      'Find workers near you. Our system prioritizes proximity for faster service and lower costs.',
  },
  {
    id: 'realtime',
    icon: Clock,
    color: 'violet',
    title: 'Real-Time Booking',
    description:
      'No back-and-forth. See availability and book instantly with confirmed time slots.',
  },
  {
    id: 'support',
    icon: Headphones,
    color: 'teal',
    title: '24/7 Support',
    description:
      'Dedicated support team for both workers and clients. We\'re always here to help.',
  },
];
