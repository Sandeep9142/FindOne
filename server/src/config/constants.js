export const USER_ROLES = ['worker', 'client', 'admin'];
export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];
export const BACKGROUND_CHECK_STATUSES = ['pending', 'approved', 'rejected'];
export const JOB_STATUSES = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];
export const JOB_URGENCY = ['low', 'medium', 'high'];
export const BUDGET_TYPES = ['fixed', 'hourly'];
export const APPLICATION_WORKFLOW_STATUSES = [
  'applied',
  'verification',
  'accepted_by_client',
  'work_started',
  'work_completed',
  'payment',
  'review',
];
export const APPLICATION_TERMINAL_STATUSES = ['rejected', 'cancelled', 'withdrawn'];
export const LEGACY_APPLICATION_STATUSES = ['pending', 'shortlisted', 'accepted'];
export const APPLICATION_STATUSES = [
  ...APPLICATION_WORKFLOW_STATUSES,
  ...APPLICATION_TERMINAL_STATUSES,
  ...LEGACY_APPLICATION_STATUSES,
];
export const BOOKING_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'authorized', 'paid', 'refunded', 'failed'];
export const MESSAGE_TYPES = ['text', 'image', 'system'];
