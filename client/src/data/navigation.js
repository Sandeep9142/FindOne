import { Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';

export const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#categories', label: 'Categories' },
  { href: '#for-workers', label: 'For Workers' },
  { href: '#for-clients', label: 'For Clients' },
];

export const FOOTER_LINKS = [
  {
    title: 'Explore',
    links: [
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Categories', href: '/#categories' },
      { label: 'For Workers', href: '/#for-workers' },
      { label: 'For Clients', href: '/#for-clients' },
    ],
  },
  {
    title: 'Marketplace',
    links: [
      { label: 'Find Workers', href: '/workers' },
      { label: 'Find Work', href: '/jobs' },
      { label: 'Join as Client', href: '/register?role=client' },
      { label: 'Join as Worker', href: '/register?role=worker' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log In', href: '/login' },
      { label: 'Messages', href: '/dashboard/messages' },
      { label: 'Client Dashboard', href: '/dashboard/client' },
      { label: 'Worker Dashboard', href: '/dashboard/worker' },
    ],
  },
  {
    title: 'Highlights',
    links: [
      { label: 'Testimonials', href: '/#testimonials' },
      { label: 'Stats', href: '/#stats' },
      { label: 'Get Started', href: '/#cta' },
    ],
  },
];

export const SOCIAL_LINKS = [
  { label: 'Twitter', href: 'https://twitter.com/findone', icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/findone', icon: Linkedin },
  { label: 'Instagram', href: 'https://instagram.com/findone', icon: Instagram },
  { label: 'YouTube', href: 'https://youtube.com/@findone', icon: Youtube },
];
