import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Search,
  Star,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Button from '@components/common/Button';
import { bookingService, jobService, paymentService, workerService } from '@services';
import { useAuthStore, useUIStore } from '@store';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Flexible';
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

const APPLICATION_TRACKING_STEPS = [
  { key: 'applied', label: 'Applied' },
  { key: 'verification', label: 'Verification' },
  { key: 'accepted_by_client', label: 'Accepted by client' },
  { key: 'work_started', label: 'Work started' },
  { key: 'work_completed', label: 'Work completed' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

const STATUS_LABELS = {
  applied: 'Applied',
  verification: 'Verification',
  accepted_by_client: 'Accepted by client',
  work_started: 'Work started',
  work_completed: 'Work completed',
  payment: 'Payment',
  review: 'Review',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  withdrawn: 'Withdrawn',
};

const LEGACY_STATUS_MAP = {
  pending: 'applied',
  shortlisted: 'verification',
  accepted: 'accepted_by_client',
};

const TERMINAL_STATUSES = new Set(['rejected', 'cancelled', 'withdrawn']);
const APPLICATION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
  { key: 'closed', label: 'Closed' },
];
const APPLICATION_GROUPS = [
  {
    key: 'in_progress',
    label: 'In progress',
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    key: 'done',
    label: 'Done',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    key: 'closed',
    label: 'Closed',
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
  },
];
const DEFAULT_VISIBLE_GROUP_COUNTS = {
  in_progress: 10,
  done: 10,
  closed: 10,
};

const BOOKING_TRACKING_STEPS = [
  { key: 'booked_by_client', label: 'Booked by client' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'work_started', label: 'Work started' },
  { key: 'work_completed', label: 'Work completed' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

const BOOKING_TERMINAL_STATUSES = new Set(['cancelled']);

const BOOKING_STATUS_LABELS = {
  booked_by_client: 'Booked by client',
  confirmed: 'Confirmed',
  work_started: 'Work started',
  work_completed: 'Work completed',
  payment: 'Payment pending',
  review: 'Reviewed',
  cancelled: 'Cancelled',
};

function normalizeApplicationStatus(status) {
  return LEGACY_STATUS_MAP[status] || status || 'applied';
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

function getStatusLabel(status) {
  const normalized = normalizeApplicationStatus(status);
  return STATUS_LABELS[normalized] || STATUS_LABELS.applied;
}

function getTrackingState(application) {
  let normalizedStatus = normalizeApplicationStatus(application.status);
  if (
    normalizedStatus === 'work_completed' &&
    ['authorized', 'paid'].includes(application?.jobId?.paymentStatus)
  ) {
    normalizedStatus = 'payment';
  }
  const isTerminal = TERMINAL_STATUSES.has(normalizedStatus);
  const statusHistory = Array.isArray(application.statusHistory) ? application.statusHistory : [];

  const statusTimestamps = {};
  statusHistory.forEach((entry) => {
    const normalizedEntryStatus = normalizeApplicationStatus(entry.status);
    if (entry.changedAt) {
      statusTimestamps[normalizedEntryStatus] = entry.changedAt;
    }
  });

  if (!statusTimestamps.applied && application.createdAt) {
    statusTimestamps.applied = application.createdAt;
  }

  const currentStepIndex = APPLICATION_TRACKING_STEPS.findIndex((step) => step.key === normalizedStatus);

  let lastReachedStepIndex = currentStepIndex;
  if (lastReachedStepIndex < 0) {
    const reversedHistory = [...statusHistory].reverse();
    const lastWorkflowHistoryEntry = reversedHistory.find((entry) =>
      APPLICATION_TRACKING_STEPS.some((step) => step.key === normalizeApplicationStatus(entry.status))
    );

    if (lastWorkflowHistoryEntry) {
      const statusFromHistory = normalizeApplicationStatus(lastWorkflowHistoryEntry.status);
      lastReachedStepIndex = APPLICATION_TRACKING_STEPS.findIndex((step) => step.key === statusFromHistory);
    }
  }

  if (lastReachedStepIndex < 0) {
    lastReachedStepIndex = 0;
  }

  const currentProgressIndex = isTerminal ? lastReachedStepIndex : currentStepIndex;
  const stepNumber = Math.min(
    APPLICATION_TRACKING_STEPS.length,
    Math.max(1, (currentProgressIndex >= 0 ? currentProgressIndex : 0) + 1)
  );

  return {
    normalizedStatus,
    isTerminal,
    currentStepIndex,
    lastReachedStepIndex,
    statusTimestamps,
    stepNumber,
  };
}

function getProgressPercent(tracking) {
  const progressIndex = tracking.isTerminal ? tracking.lastReachedStepIndex : tracking.currentStepIndex;
  const safeProgressIndex = Math.max(0, progressIndex);
  return Math.round(((safeProgressIndex + 1) / APPLICATION_TRACKING_STEPS.length) * 100);
}

function getStatusToneClasses(status) {
  if (status === 'review') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'payment' || status === 'work_completed') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'accepted_by_client' || status === 'work_started') {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (status === 'verification' || status === 'applied') {
    return 'bg-amber-100 text-amber-700';
  }

  if (TERMINAL_STATUSES.has(status)) {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function getLastApplicationUpdateAt(application) {
  const history = Array.isArray(application.statusHistory) ? application.statusHistory : [];
  const lastHistoryEntry = history
    .filter((entry) => entry?.changedAt)
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];

  return lastHistoryEntry?.changedAt || application.updatedAt || application.createdAt || null;
}

function getApplicationGroupKey(tracking) {
  if (tracking.isTerminal) {
    return 'closed';
  }

  if (tracking.normalizedStatus === 'review') {
    return 'done';
  }

  return 'in_progress';
}

function normalizeBookingStatus(booking) {
  if (!booking || typeof booking !== 'object') {
    return 'booked_by_client';
  }

  if (booking.status === 'cancelled') {
    return 'cancelled';
  }

  if (booking.review) {
    return 'review';
  }

  if (booking.paymentStatus === 'authorized' || booking.paymentStatus === 'paid') {
    return 'payment';
  }

  if (booking.status === 'completed') {
    return 'work_completed';
  }

  if (booking.status === 'in_progress') {
    return 'work_started';
  }

  if (booking.status === 'confirmed') {
    return 'confirmed';
  }

  return 'booked_by_client';
}

function getBookingTrackingState(booking) {
  const normalizedStatus = normalizeBookingStatus(booking);
  const isTerminal = BOOKING_TERMINAL_STATUSES.has(normalizedStatus);
  const currentStepIndex = BOOKING_TRACKING_STEPS.findIndex((step) => step.key === normalizedStatus);
  const lastReachedStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const stepNumber = Math.min(
    BOOKING_TRACKING_STEPS.length,
    Math.max(1, (currentStepIndex >= 0 ? currentStepIndex : 0) + 1)
  );

  return {
    normalizedStatus,
    isTerminal,
    currentStepIndex,
    lastReachedStepIndex,
    stepNumber,
  };
}

function getBookingProgressPercent(tracking) {
  const safeProgressIndex = Math.max(0, tracking.currentStepIndex);
  return Math.round(((safeProgressIndex + 1) / BOOKING_TRACKING_STEPS.length) * 100);
}

function getBookingGroupKey(tracking) {
  if (tracking.isTerminal) {
    return 'closed';
  }

  if (tracking.normalizedStatus === 'review') {
    return 'done';
  }

  return 'in_progress';
}

function getBookingStatusToneClasses(status) {
  if (status === 'review') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'payment' || status === 'work_completed') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'work_started' || status === 'confirmed') {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (status === 'booked_by_client') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'cancelled') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function getLastBookingUpdateAt(booking) {
  return booking.updatedAt || booking.createdAt || booking.bookingDate || null;
}

function getBookingPrimaryAction(booking) {
  if (booking.status === 'pending') {
    return {
      targetStatus: 'confirmed',
      label: 'Accept booking',
    };
  }

  if (booking.status === 'confirmed') {
    return {
      targetStatus: 'in_progress',
      label: 'Start work',
    };
  }

  return null;
}

export default function WorkerDashboardPage() {
  const hasLoadedRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState('');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [expandedApplications, setExpandedApplications] = useState({});
  const [visibleGroupCounts, setVisibleGroupCounts] = useState(DEFAULT_VISIBLE_GROUP_COUNTS);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('applications');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [expandedBookings, setExpandedBookings] = useState({});
  const [visibleBookingGroupCounts, setVisibleBookingGroupCounts] = useState(DEFAULT_VISIBLE_GROUP_COUNTS);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [workerProfileResult, appliedJobsResult, bookingListResult, paymentListResult] =
          await Promise.allSettled([
            workerService.getMyProfile(),
            jobService.getMyApplied(),
            bookingService.getAll(),
            paymentService.getAll({ limit: 50 }),
          ]);

        if (workerProfileResult.status === 'fulfilled') {
          setProfile(workerProfileResult.value);
        } else {
          showToast(getErrorMessage(workerProfileResult.reason, 'Unable to load worker profile.'), 'error');
        }

        if (appliedJobsResult.status === 'fulfilled') {
          setApplications(appliedJobsResult.value);
        } else {
          setApplications([]);
        }

        if (bookingListResult.status === 'fulfilled') {
          setBookings(bookingListResult.value);
        } else {
          setBookings([]);
        }

        if (paymentListResult.status === 'fulfilled') {
          setPayments(paymentListResult.value);
        } else {
          setPayments([]);
        }
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load dashboard data.'), 'error');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [showToast]);

  const stats = [
    {
      label: 'Total Earnings',
      value: formatCurrency(
        payments
          .filter((payment) => payment.status === 'paid')
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      ),
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      label: 'Jobs Completed',
      value: bookings.filter((booking) => booking.status === 'completed').length,
      icon: Briefcase,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      label: 'Avg Rating',
      value: profile?.ratingAverage?.toFixed?.(1) || '0.0',
      icon: Star,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      label: 'Active Bookings',
      value: bookings.filter((booking) => ['pending', 'confirmed', 'in_progress'].includes(booking.status)).length,
      icon: TrendingUp,
      color: 'text-violet-500 bg-violet-50',
    },
  ];

  const trackedApplications = applications
    .map((application) => {
      const tracking = getTrackingState(application);
      return {
        application,
        tracking,
        progressPercent: getProgressPercent(tracking),
        lastUpdatedAt: getLastApplicationUpdateAt(application),
      };
    })
    .sort((left, right) => {
      const leftTime = left.lastUpdatedAt ? new Date(left.lastUpdatedAt).getTime() : 0;
      const rightTime = right.lastUpdatedAt ? new Date(right.lastUpdatedAt).getTime() : 0;
      return rightTime - leftTime;
    });

  const applicationCounts = trackedApplications.reduce(
    (counts, item) => {
      const groupKey = getApplicationGroupKey(item.tracking);
      counts.all += 1;
      counts[groupKey] += 1;

      return counts;
    },
    { all: 0, in_progress: 0, done: 0, closed: 0 }
  );

  const filteredApplications = trackedApplications.filter(({ application, tracking }) => {
    const searchTerm = applicationSearch.trim().toLowerCase();
    if (searchTerm) {
      const title = application.jobId?.title?.toLowerCase() || '';
      const category = application.jobId?.categoryId?.name?.toLowerCase() || '';
      const client = application.jobId?.clientId?.fullName?.toLowerCase() || '';
      const matchesSearch = title.includes(searchTerm) || category.includes(searchTerm) || client.includes(searchTerm);
      if (!matchesSearch) {
        return false;
      }
    }

    if (applicationFilter === 'all') {
      return true;
    }

    if (applicationFilter === 'closed') {
      return tracking.isTerminal;
    }

    if (applicationFilter === 'done') {
      return tracking.normalizedStatus === 'review';
    }

    if (applicationFilter === 'in_progress') {
      return !tracking.isTerminal && tracking.normalizedStatus !== 'review';
    }

    return true;
  });

  const groupedFilteredApplications = filteredApplications.reduce(
    (groups, item) => {
      const groupKey = getApplicationGroupKey(item.tracking);
      groups[groupKey].push(item);
      return groups;
    },
    { in_progress: [], done: [], closed: [] }
  );

  const visibleGroupKeys =
    applicationFilter === 'all'
      ? APPLICATION_GROUPS.map((group) => group.key)
      : APPLICATION_GROUPS.filter((group) => group.key === applicationFilter).map((group) => group.key);

  const trackedBookings = bookings
    .map((booking) => {
      const tracking = getBookingTrackingState(booking);
      return {
        booking,
        tracking,
        progressPercent: getBookingProgressPercent(tracking),
        lastUpdatedAt: getLastBookingUpdateAt(booking),
        primaryAction: getBookingPrimaryAction(booking),
      };
    })
    .sort((left, right) => {
      const leftTime = left.lastUpdatedAt ? new Date(left.lastUpdatedAt).getTime() : 0;
      const rightTime = right.lastUpdatedAt ? new Date(right.lastUpdatedAt).getTime() : 0;
      return rightTime - leftTime;
    });

  const bookingCounts = trackedBookings.reduce(
    (counts, item) => {
      const groupKey = getBookingGroupKey(item.tracking);
      counts.all += 1;
      counts[groupKey] += 1;

      return counts;
    },
    { all: 0, in_progress: 0, done: 0, closed: 0 }
  );

  const filteredBookings = trackedBookings.filter(({ booking, tracking }) => {
    const searchTerm = bookingSearch.trim().toLowerCase();
    if (searchTerm) {
      const title = booking.title?.toLowerCase() || '';
      const client = booking.clientId?.fullName?.toLowerCase() || '';
      const city = booking.address?.city?.toLowerCase() || '';
      const matchesSearch = title.includes(searchTerm) || client.includes(searchTerm) || city.includes(searchTerm);
      if (!matchesSearch) {
        return false;
      }
    }

    if (bookingFilter === 'all') {
      return true;
    }

    if (bookingFilter === 'closed') {
      return tracking.isTerminal;
    }

    if (bookingFilter === 'done') {
      return tracking.normalizedStatus === 'review';
    }

    if (bookingFilter === 'in_progress') {
      return !tracking.isTerminal && tracking.normalizedStatus !== 'review';
    }

    return true;
  });

  const groupedFilteredBookings = filteredBookings.reduce(
    (groups, item) => {
      const groupKey = getBookingGroupKey(item.tracking);
      groups[groupKey].push(item);
      return groups;
    },
    { in_progress: [], done: [], closed: [] }
  );

  const visibleBookingGroupKeys =
    bookingFilter === 'all'
      ? APPLICATION_GROUPS.map((group) => group.key)
      : APPLICATION_GROUPS.filter((group) => group.key === bookingFilter).map((group) => group.key);

  useEffect(() => {
    setVisibleGroupCounts(DEFAULT_VISIBLE_GROUP_COUNTS);
  }, [applicationSearch, applicationFilter, applications.length]);

  useEffect(() => {
    setVisibleBookingGroupCounts(DEFAULT_VISIBLE_GROUP_COUNTS);
  }, [bookingSearch, bookingFilter, bookings.length]);

  async function handleToggleStatus() {
    if (!profile || togglingStatus) {
      return;
    }

    setTogglingStatus(true);
    try {
      const updatedProfile = await workerService.updateProfile({
        isAvailableNow: !profile.isAvailableNow,
      });
      setProfile(updatedProfile);
      showToast(updatedProfile.isAvailableNow ? 'You are now online' : 'You are now offline');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update your status.'), 'error');
    } finally {
      setTogglingStatus(false);
    }
  }

  function toggleApplicationTimeline(applicationId) {
    setExpandedApplications((current) => ({
      ...current,
      [applicationId]: !current[applicationId],
    }));
  }

  function handleShowMoreApplications(groupKey) {
    setVisibleGroupCounts((current) => ({
      ...current,
      [groupKey]: (current[groupKey] || 0) + 10,
    }));
  }

  function toggleBookingTimeline(bookingId) {
    setExpandedBookings((current) => ({
      ...current,
      [bookingId]: !current[bookingId],
    }));
  }

  function handleShowMoreBookings(groupKey) {
    setVisibleBookingGroupCounts((current) => ({
      ...current,
      [groupKey]: (current[groupKey] || 0) + 10,
    }));
  }

  async function handleMarkWorkStarted(applicationId) {
    if (!applicationId || updatingApplicationId) {
      return;
    }

    setUpdatingApplicationId(applicationId);
    try {
      const updatedApplication = await jobService.updateApplicationStatus(applicationId, {
        status: 'work_started',
      });

      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId ? updatedApplication : application
        )
      );
      showToast('Work marked as started');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update application status.'), 'error');
    } finally {
      setUpdatingApplicationId('');
    }
  }

  async function handleUpdateBookingStatus(bookingId, status, successMessage) {
    if (!bookingId || !status || updatingBookingId) {
      return;
    }

    setUpdatingBookingId(bookingId);
    try {
      const updatedBooking = await bookingService.updateStatus(bookingId, status);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? { ...booking, ...updatedBooking } : booking
        )
      );
      showToast(successMessage);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update booking status.'), 'error');
    } finally {
      setUpdatingBookingId('');
    }
  }

  async function handleCancelBooking(bookingId) {
    if (!bookingId || cancellingBookingId) {
      return;
    }

    setCancellingBookingId(bookingId);
    try {
      const cancelledBooking = await bookingService.cancel(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? { ...booking, ...cancelledBooking } : booking
        )
      );
      showToast('Booking cancelled');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to cancel booking.'), 'error');
    } finally {
      setCancellingBookingId('');
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Worker'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track applications, bookings, earnings, and your availability.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/jobs">
            <Button variant="primary" size="lg">
              Find work
            </Button>
          </Link>
          <Link to={`/worker/${profile?._id || ''}`}>
            <Button variant="ghost" size="lg">
              View public profile
            </Button>
          </Link>
        </div>
      </div>

      <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Online Status</h3>
            <p className="mt-1 text-sm text-slate-500">Set your live availability for client requests.</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                profile?.isAvailableNow ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {profile?.isAvailableNow ? <Wifi size={14} /> : <WifiOff size={14} />}
              {profile?.isAvailableNow ? 'Online' : 'Offline'}
            </span>
            <button
              type="button"
              aria-label="Toggle online status"
              aria-pressed={Boolean(profile?.isAvailableNow)}
              disabled={togglingStatus}
              onClick={handleToggleStatus}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                profile?.isAvailableNow ? 'bg-emerald-500' : 'bg-slate-300'
              } disabled:opacity-60`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  profile?.isAvailableNow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">{label}</span>
            </div>
            <span className="text-2xl font-bold text-dark">{value}</span>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveWorkflowTab('applications')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeWorkflowTab === 'applications'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Applied jobs workflow ({applicationCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveWorkflowTab('bookings')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeWorkflowTab === 'bookings'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Direct bookings workflow ({bookingCounts.all})
          </button>
        </div>
      </section>

      {activeWorkflowTab === 'applications' ? (
        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Applied jobs</h3>
              <p className="mt-1 text-sm text-slate-500">Track every application with clear progress and status</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">All</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{applicationCounts.all}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">In progress</p>
              <p className="mt-1 text-lg font-semibold text-blue-700">{applicationCounts.in_progress}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Done</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">{applicationCounts.done}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-rose-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-600">Closed</p>
              <p className="mt-1 text-lg font-semibold text-rose-700">{applicationCounts.closed}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={applicationSearch}
                onChange={(event) => setApplicationSearch(event.target.value)}
                placeholder="Search by job, category, or client"
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {APPLICATION_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setApplicationFilter(filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    applicationFilter === filter.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Legend</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Current step
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Completed step
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Pending step
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  Closed application
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 max-h-[38rem] space-y-4 overflow-y-auto pr-1">
            {filteredApplications.length > 0 ? (
              visibleGroupKeys.map((groupKey) => {
                const group = APPLICATION_GROUPS.find((item) => item.key === groupKey);
                const groupItems = groupedFilteredApplications[groupKey] || [];

                if (!group || groupItems.length === 0) {
                  return null;
                }

                const visibleCount = visibleGroupCounts[groupKey] || 10;
                const visibleItems = groupItems.slice(0, visibleCount);
                const hasMore = groupItems.length > visibleCount;

                return (
                  <div key={group.key} className="space-y-3">
                    <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${group.tone}`}>
                        {group.label}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {groupItems.length} application{groupItems.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {visibleItems.map(({ application, tracking, progressPercent, lastUpdatedAt }) => {
                      const isExpanded = Boolean(expandedApplications[application._id]);

                      return (
                        <article key={application._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{application.jobId?.title || 'Job'}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {application.jobId?.categoryId?.name || 'General'} - {application.jobId?.location?.city},{' '}
                                {application.jobId?.location?.state}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusToneClasses(
                                tracking.normalizedStatus
                              )}`}
                            >
                              {getStatusLabel(tracking.normalizedStatus)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span>{formatCurrency(application.proposedRate)}</span>
                            <span>{application.jobId?.clientId?.fullName || 'Client'}</span>
                            <span>{application.jobId?.paymentStatus || 'pending'} payment</span>
                            <span className="font-medium text-slate-700">
                              Step {tracking.stepNumber} of {APPLICATION_TRACKING_STEPS.length}
                            </span>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                              <span>Progress</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  tracking.isTerminal ? 'bg-rose-400' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className="mt-2 grid grid-cols-7 gap-1">
                              {APPLICATION_TRACKING_STEPS.map((step, index) => {
                                const isCurrent =
                                  !tracking.isTerminal &&
                                  tracking.currentStepIndex >= 0 &&
                                  tracking.currentStepIndex === index;
                                const isReached = index <= tracking.lastReachedStepIndex;

                                return (
                                  <span
                                    key={`${application._id}-${step.key}-progress`}
                                    title={step.label}
                                    className={`h-1.5 rounded-full ${
                                      isCurrent
                                        ? 'bg-blue-500'
                                        : isReached
                                          ? 'bg-emerald-400'
                                          : 'bg-slate-200'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                              Last updated {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'just now'}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            {tracking.normalizedStatus === 'accepted_by_client' && !tracking.isTerminal ? (
                              <Button
                                variant="outline"
                                size="sm"
                                loading={updatingApplicationId === application._id}
                                onClick={() => handleMarkWorkStarted(application._id)}
                              >
                                Mark work started
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">Timeline details available below</span>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleApplicationTimeline(application._id)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              {isExpanded ? 'Hide timeline' : 'View timeline'}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>

                          {isExpanded ? (
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                              <div className="space-y-2">
                                {APPLICATION_TRACKING_STEPS.map((step, index) => {
                                  const isCurrent =
                                    !tracking.isTerminal &&
                                    tracking.currentStepIndex >= 0 &&
                                    tracking.currentStepIndex === index;
                                  const isReached = index <= tracking.lastReachedStepIndex;
                                  const timestamp = tracking.statusTimestamps[step.key];

                                  return (
                                    <div
                                      key={`${application._id}-${step.key}`}
                                      className="flex items-start gap-3 rounded-lg bg-white px-3 py-2"
                                    >
                                      <span
                                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                          isCurrent
                                            ? 'bg-blue-500 text-white'
                                            : isReached
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-slate-200 text-slate-500'
                                        }`}
                                      >
                                        {isCurrent ? index + 1 : isReached ? '+' : index + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <p className={`text-sm ${isCurrent ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                          {step.label}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {timestamp ? formatDateTime(timestamp) : 'Pending'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}

                    {hasMore ? (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleShowMoreApplications(group.key)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Show 10 more ({groupItems.length - visibleCount} remaining)
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : applications.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No applications matched your search or filter.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No job applications yet.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Direct bookings</h3>
              <p className="mt-1 text-sm text-slate-500">Track client-picked work with the same progress workflow</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">All</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{bookingCounts.all}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">In progress</p>
              <p className="mt-1 text-lg font-semibold text-blue-700">{bookingCounts.in_progress}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Done</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">{bookingCounts.done}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-rose-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-600">Closed</p>
              <p className="mt-1 text-lg font-semibold text-rose-700">{bookingCounts.closed}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(event) => setBookingSearch(event.target.value)}
                placeholder="Search by booking, client, or city"
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {APPLICATION_FILTERS.map((filter) => (
                <button
                  key={`booking-${filter.key}`}
                  type="button"
                  onClick={() => setBookingFilter(filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    bookingFilter === filter.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 max-h-[38rem] space-y-4 overflow-y-auto pr-1">
            {filteredBookings.length > 0 ? (
              visibleBookingGroupKeys.map((groupKey) => {
                const group = APPLICATION_GROUPS.find((item) => item.key === groupKey);
                const groupItems = groupedFilteredBookings[groupKey] || [];

                if (!group || groupItems.length === 0) {
                  return null;
                }

                const visibleCount = visibleBookingGroupCounts[groupKey] || 10;
                const visibleItems = groupItems.slice(0, visibleCount);
                const hasMore = groupItems.length > visibleCount;

                return (
                  <div key={`booking-group-${group.key}`} className="space-y-3">
                    <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${group.tone}`}>
                        {group.label}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {groupItems.length} booking{groupItems.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {visibleItems.map(({ booking, tracking, progressPercent, lastUpdatedAt, primaryAction }) => {
                      const isExpanded = Boolean(expandedBookings[booking._id]);

                      return (
                        <article key={booking._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{booking.title}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {booking.clientId?.fullName || 'Client'} - {formatDate(booking.bookingDate)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {booking.address?.city || 'City'}, {booking.address?.state || 'State'}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getBookingStatusToneClasses(
                                tracking.normalizedStatus
                              )}`}
                            >
                              {BOOKING_STATUS_LABELS[tracking.normalizedStatus] || BOOKING_STATUS_LABELS.booked_by_client}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span>{formatCurrency(booking.amount)}</span>
                            <span>{booking.paymentStatus} payment</span>
                            <span className="font-medium text-slate-700">
                              Step {tracking.stepNumber} of {BOOKING_TRACKING_STEPS.length}
                            </span>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                              <span>Progress</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  tracking.isTerminal ? 'bg-rose-400' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className="mt-2 grid grid-cols-6 gap-1">
                              {BOOKING_TRACKING_STEPS.map((step, index) => {
                                const isCurrent =
                                  !tracking.isTerminal &&
                                  tracking.currentStepIndex >= 0 &&
                                  tracking.currentStepIndex === index;
                                const isReached = index <= tracking.lastReachedStepIndex;

                                return (
                                  <span
                                    key={`${booking._id}-${step.key}-progress`}
                                    title={step.label}
                                    className={`h-1.5 rounded-full ${
                                      isCurrent
                                        ? 'bg-blue-500'
                                        : isReached
                                          ? 'bg-emerald-400'
                                          : 'bg-slate-200'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                              Last updated {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'just now'}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                              {primaryAction ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  loading={updatingBookingId === booking._id}
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      booking._id,
                                      primaryAction.targetStatus,
                                      `${primaryAction.label} updated`
                                    )
                                  }
                                >
                                  {primaryAction.label}
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400">No worker action required now.</span>
                              )}

                              {['pending', 'confirmed'].includes(booking.status) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  loading={cancellingBookingId === booking._id}
                                  onClick={() => handleCancelBooking(booking._id)}
                                >
                                  Cancel booking
                                </Button>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleBookingTimeline(booking._id)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              {isExpanded ? 'Hide timeline' : 'View timeline'}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>

                          {isExpanded ? (
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                              <div className="space-y-2">
                                {BOOKING_TRACKING_STEPS.map((step, index) => {
                                  const isCurrent =
                                    !tracking.isTerminal &&
                                    tracking.currentStepIndex >= 0 &&
                                    tracking.currentStepIndex === index;
                                  const isReached = index <= tracking.lastReachedStepIndex;

                                  return (
                                    <div
                                      key={`${booking._id}-${step.key}`}
                                      className="flex items-start gap-3 rounded-lg bg-white px-3 py-2"
                                    >
                                      <span
                                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                          isCurrent
                                            ? 'bg-blue-500 text-white'
                                            : isReached
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-slate-200 text-slate-500'
                                        }`}
                                      >
                                        {isCurrent ? index + 1 : isReached ? '+' : index + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <p className={`text-sm ${isCurrent ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                          {step.label}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}

                    {hasMore ? (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleShowMoreBookings(group.key)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Show 10 more ({groupItems.length - visibleCount} remaining)
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : bookings.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No direct bookings matched your search or filter.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No bookings yet.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
