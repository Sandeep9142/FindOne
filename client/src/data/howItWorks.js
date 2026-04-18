import {
  Briefcase,
  CalendarCheck,
  CreditCard,
  ListChecks,
  Search,
  UserPlus,
} from 'lucide-react';

// How It Works steps are written from the flows implemented in the app:
// workers directory, direct bookings, jobs, dashboards, payments, and reviews.

export const CLIENT_STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Find Nearby Workers',
    description: 'Search by skill, service category, availability, and your saved client location.',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Create a Booking',
    description: 'Open a worker profile, choose the service, date, hours, address, and confirm.',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Track, Pay, Review',
    description: 'Follow booking progress in your dashboard, pay after completion, then rate the worker.',
  },
];

export const WORKER_STEPS = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Build Your Profile',
    description: 'Add your skills, service categories, rate, experience, photo, and service location.',
  },
  {
    number: '02',
    icon: Briefcase,
    title: 'Apply or Accept Work',
    description: 'Apply to open jobs that match your categories or accept direct client bookings.',
  },
  {
    number: '03',
    icon: ListChecks,
    title: 'Update Progress',
    description: 'Move work through started, completed, payment, and review steps from your dashboard.',
  },
];
