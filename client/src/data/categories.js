import {
  Wrench,
  Sparkles,
  Zap,
  Droplets,
  CalendarHeart,
  GraduationCap,
  Truck,
  Monitor,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Service Categories
   ───────────────────────────────────────────── */

export const CATEGORIES = [
  { id: 'home-repairs', name: 'Home Repairs', count: '2,400+', icon: Wrench, color: 'blue' },
  { id: 'cleaning', name: 'Cleaning', count: '3,100+', icon: Sparkles, color: 'green' },
  { id: 'electrical', name: 'Electrical', count: '1,800+', icon: Zap, color: 'amber' },
  { id: 'plumbing', name: 'Plumbing', count: '1,600+', icon: Droplets, color: 'blue' },
  { id: 'beauty', name: 'Beauty & Wellness', count: '2,200+', icon: CalendarHeart, color: 'pink' },
  { id: 'tutoring', name: 'Tutoring', count: '4,500+', icon: GraduationCap, color: 'violet' },
  { id: 'delivery', name: 'Delivery', count: '5,800+', icon: Truck, color: 'emerald' },
  { id: 'tech-support', name: 'Tech Support', count: '1,200+', icon: Monitor, color: 'blue' },
];
