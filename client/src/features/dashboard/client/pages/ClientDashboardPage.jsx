import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, ListChecks, MapPin, Search, Star, Trash2, Users } from 'lucide-react';
import Button from '@components/common/Button';
import { Modal } from '@components/ui';
import { bookingService, clientService, jobService, paymentService } from '@services';
import { useAuthStore, useUIStore } from '@store';
import { getBrowserLocation } from '@utils';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Flexible';
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
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

const LEGACY_STATUS_MAP = {
  pending: 'applied',
  shortlisted: 'verification',
  accepted: 'accepted_by_client',
};

const TERMINAL_STATUSES = new Set(['rejected', 'cancelled', 'withdrawn']);
const BOOKING_TERMINAL_STATUSES = new Set(['cancelled']);
const TRACKER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
  { key: 'closed', label: 'Closed' },
];
const BOOKING_TRACKING_STEPS = [
  { key: 'booked_by_client', label: 'Booked by client' },
  { key: 'confirmed', label: 'Confirmed' },
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
  rejected: 'Rejected by client',
  cancelled: 'Cancelled',
  withdrawn: 'Withdrawn',
};

const BOOKING_STATUS_LABELS = {
  booked_by_client: 'Booked by client',
  confirmed: 'Confirmed',
  work_started: 'Work started',
  work_completed: 'Work completed',
  payment: 'Payment',
  review: 'Review',
  cancelled: 'Cancelled',
};

function normalizeApplicationStatus(status) {
  return LEGACY_STATUS_MAP[status] || status || 'applied';
}

function getStatusToneClass(status) {
  if (status === 'review') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'work_completed' || status === 'payment') {
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

function getClientTrackingState(application) {
  let normalizedStatus = normalizeApplicationStatus(application.status);
  const jobContext = getApplicationJobContext(application);
  if (
    normalizedStatus === 'work_completed' &&
    ['authorized', 'paid'].includes(jobContext?.paymentStatus)
  ) {
    normalizedStatus = 'payment';
  }
  const statusHistory = Array.isArray(application.statusHistory) ? application.statusHistory : [];

  const currentStepIndex = APPLICATION_TRACKING_STEPS.findIndex((step) => step.key === normalizedStatus);
  const historyStepIndexes = statusHistory
    .map((entry) => APPLICATION_TRACKING_STEPS.findIndex((step) => step.key === normalizeApplicationStatus(entry.status)))
    .filter((index) => index >= 0);

  const lastReachedStepIndex = Math.max(currentStepIndex, ...historyStepIndexes, 0);
  const isTerminal = TERMINAL_STATUSES.has(normalizedStatus);

  return {
    normalizedStatus,
    currentStepIndex,
    lastReachedStepIndex,
    isTerminal,
  };
}

function getClientPrimaryAction(status) {
  if (status === 'applied') {
    return {
      targetStatus: 'verification',
      label: 'Mark verification',
    };
  }

  if (status === 'verification') {
    return {
      targetStatus: 'accepted_by_client',
      label: 'Accept worker',
    };
  }

  if (status === 'work_started') {
    return {
      targetStatus: 'work_completed',
      label: 'Mark work completed',
    };
  }

  return null;
}

function getClientSecondaryAction(status) {
  if (status === 'applied' || status === 'verification') {
    return {
      targetStatus: 'rejected',
      label: 'Reject worker',
    };
  }

  return null;
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

function getApplicationJobContext(application) {
  if (application.jobContext && typeof application.jobContext === 'object') {
    return application.jobContext;
  }

  if (application.jobId && typeof application.jobId === 'object') {
    return application.jobId;
  }

  return null;
}

function getApplicationJobId(application) {
  const jobContext = getApplicationJobContext(application);

  if (jobContext?._id) {
    return String(jobContext._id);
  }

  if (application.jobId && typeof application.jobId === 'object') {
    return String(application.jobId._id || '');
  }

  return String(application.jobId || '');
}

function getJobStatusLabel(status) {
  if (status === 'assigned') {
    return 'closed';
  }

  return status || 'open';
}

function getWorkerProfilePath(application) {
  const workerProfileId =
    application.workerProfileId ||
    application.workerId?.workerProfileId ||
    application.workerId?.profileId ||
    '';

  if (!workerProfileId) {
    return '';
  }

  return `/worker/${workerProfileId}`;
}

function getBookingWorkerProfilePath(booking) {
  const workerProfileId =
    booking.workerProfileId ||
    booking.workerId?.workerProfileId ||
    booking.workerId?.profileId ||
    '';

  if (!workerProfileId) {
    return '';
  }

  return `/worker/${workerProfileId}`;
}

function normalizeClientBookingStatus(booking) {
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

function getClientBookingTrackingState(booking) {
  const normalizedStatus = normalizeClientBookingStatus(booking);
  const isTerminal = BOOKING_TERMINAL_STATUSES.has(normalizedStatus);
  const currentStepIndex = BOOKING_TRACKING_STEPS.findIndex((step) => step.key === normalizedStatus);
  const safeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return {
    normalizedStatus,
    currentStepIndex,
    lastReachedStepIndex: safeStepIndex,
    isTerminal,
    stepNumber: Math.max(1, safeStepIndex + 1),
  };
}

function getBookingProgressPercent(tracking) {
  const safeStepIndex = Math.max(0, tracking.lastReachedStepIndex);
  return Math.round(((safeStepIndex + 1) / BOOKING_TRACKING_STEPS.length) * 100);
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

function getBookingStatusToneClass(status) {
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

function getClientBookingPrimaryAction(booking, tracking) {
  if (!booking || tracking.isTerminal) {
    return null;
  }

  if (booking.status === 'confirmed') {
    return {
      targetStatus: 'in_progress',
      label: 'Mark work started',
    };
  }

  if (booking.status === 'in_progress') {
    return {
      targetStatus: 'completed',
      label: 'Mark work completed',
    };
  }

  return null;
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className="rounded-md p-1 transition-colors hover:bg-amber-50"
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={20}
              className={active ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
            />
          </button>
        );
      })}
    </div>
  );
}

function buildClientProfileForm(profile) {
  const preferredLocation = profile?.preferredLocations?.[0] || {};

  return {
    companyName: profile?.companyName || '',
    address: profile?.address || '',
    locationAddressLine: preferredLocation.addressLine || '',
    locationCity: preferredLocation.city || '',
    locationState: preferredLocation.state || '',
    locationPincode: preferredLocation.pincode || '',
    locationLat: preferredLocation.lat ?? '',
    locationLng: preferredLocation.lng ?? '',
  };
}

export default function ClientDashboardPage() {
  const hasLoadedRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const canEditClientLocation = user?.role === 'client';
  const [jobs, setJobs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingClientProfile, setSavingClientProfile] = useState(false);
  const [fetchingClientLocation, setFetchingClientLocation] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState('');
  const [deletingJobId, setDeletingJobId] = useState('');
  const [payingApplicationId, setPayingApplicationId] = useState('');
  const [payingBookingId, setPayingBookingId] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('applications');
  const [applicationJobFilter, setApplicationJobFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });
  const [clientProfileForm, setClientProfileForm] = useState(buildClientProfileForm(null));
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [postedJobs, bookingList, profile] = await Promise.all([
          jobService.getMyPosted(),
          bookingService.getAll(),
          canEditClientLocation ? clientService.getMyProfile() : Promise.resolve(null),
        ]);

        const jobsWithApplications = postedJobs.filter((job) => Number(job.applicationCount || 0) > 0);
        const applicationFetchResults = await Promise.allSettled(
          jobsWithApplications.map((job) => jobService.getApplications(job._id))
        );

        const nextApplications = [];
        let failedApplicationLoads = 0;

        applicationFetchResults.forEach((result, index) => {
          const job = jobsWithApplications[index];
          if (result.status !== 'fulfilled') {
            failedApplicationLoads += 1;
            return;
          }

          const applicationsForJob = Array.isArray(result.value) ? result.value : [];
          applicationsForJob.forEach((application) => {
            nextApplications.push({
              ...application,
              jobContext: job,
            });
          });
        });

        setJobs(postedJobs);
        setBookings(bookingList);
        setApplications(nextApplications);
        if (profile) {
          setClientProfileForm(buildClientProfileForm(profile));
        }

        if (failedApplicationLoads > 0) {
          showToast('Some applications could not be loaded right now.', 'error');
        }
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load dashboard data.'), 'error');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [canEditClientLocation, showToast]);

  async function handleUseCurrentClientLocation() {
    setFetchingClientLocation(true);

    try {
      const location = await getBrowserLocation();
      setClientProfileForm((current) => ({
        ...current,
        locationLat: location.lat,
        locationLng: location.lng,
      }));
      showToast('Current location captured. Add city/state if they are empty.');
    } catch (error) {
      showToast(error.message || 'Unable to fetch current location.', 'error');
    } finally {
      setFetchingClientLocation(false);
    }
  }

  async function handleClientProfileSubmit(event) {
    event.preventDefault();
    setSavingClientProfile(true);

    try {
      const preferredLocation = {
        addressLine: clientProfileForm.locationAddressLine.trim(),
        city: clientProfileForm.locationCity.trim(),
        state: clientProfileForm.locationState.trim(),
        pincode: clientProfileForm.locationPincode.trim(),
        lat: clientProfileForm.locationLat === '' ? null : Number(clientProfileForm.locationLat),
        lng: clientProfileForm.locationLng === '' ? null : Number(clientProfileForm.locationLng),
      };
      const hasPreferredLocation = Object.values(preferredLocation).some(
        (value) => value !== '' && value !== null
      );
      const updatedProfile = await clientService.updateProfile({
        companyName: clientProfileForm.companyName.trim(),
        address: clientProfileForm.address.trim(),
        preferredLocations: hasPreferredLocation ? [preferredLocation] : [],
      });

      setClientProfileForm(buildClientProfileForm(updatedProfile));
      showToast('Client location updated successfully');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update client location.'), 'error');
    } finally {
      setSavingClientProfile(false);
    }
  }

  const stats = [
    {
      label: 'Active Jobs',
      value: jobs.filter((job) => job.status === 'open').length,
      icon: Briefcase,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      label: 'Pending Bookings',
      value: bookings.filter((booking) => booking.status === 'pending').length,
      icon: Clock,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      label: 'Completed',
      value: bookings.filter((booking) => booking.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      label: 'Workers Hired',
      value: new Set(bookings.map((booking) => booking.workerId?._id || booking.workerId)).size,
      icon: Users,
      color: 'text-violet-500 bg-violet-50',
    },
  ];

  const trackedApplications = applications
    .map((application) => {
      const tracking = getClientTrackingState(application);
      const jobContext = getApplicationJobContext(application);
      const primaryAction = getClientPrimaryAction(tracking.normalizedStatus);
      const secondaryAction = getClientSecondaryAction(tracking.normalizedStatus);
      const lastUpdatedAt = application.updatedAt || application.createdAt;

      return {
        application,
        tracking,
        jobContext,
        primaryAction,
        secondaryAction,
        lastUpdatedAt,
      };
    })
    .sort((left, right) => {
      const leftTime = left.lastUpdatedAt ? new Date(left.lastUpdatedAt).getTime() : 0;
      const rightTime = right.lastUpdatedAt ? new Date(right.lastUpdatedAt).getTime() : 0;
      return rightTime - leftTime;
    });

  const applicationJobSummaries = jobs
    .map((job) => ({
      job,
      count: applications.filter((application) => getApplicationJobId(application) === String(job._id)).length,
    }))
    .sort((left, right) => {
      const leftTime = left.job.createdAt ? new Date(left.job.createdAt).getTime() : 0;
      const rightTime = right.job.createdAt ? new Date(right.job.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });

  const visibleTrackedApplications =
    applicationJobFilter === 'all'
      ? trackedApplications
      : trackedApplications.filter(
          ({ application }) => getApplicationJobId(application) === applicationJobFilter
        );
  const selectedApplicationJob = jobs.find((job) => String(job._id) === applicationJobFilter);

  const trackedBookings = bookings
    .map((booking) => {
      const tracking = getClientBookingTrackingState(booking);
      const primaryAction = getClientBookingPrimaryAction(booking, tracking);
      const lastUpdatedAt = booking.updatedAt || booking.createdAt || booking.bookingDate;

      return {
        booking,
        tracking,
        primaryAction,
        progressPercent: getBookingProgressPercent(tracking),
        lastUpdatedAt,
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
      const worker = booking.workerId?.fullName?.toLowerCase() || '';
      const city = booking.address?.city?.toLowerCase() || '';
      const matchesSearch = title.includes(searchTerm) || worker.includes(searchTerm) || city.includes(searchTerm);
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

  function openReviewModal(booking) {
    setSelectedBooking(booking);
    setReviewForm({ rating: 5, comment: '' });
  }

  async function handleUpdateApplicationStatus(applicationId, status, successMessage) {
    if (!applicationId || !status || updatingApplicationId) {
      return;
    }

    setUpdatingApplicationId(applicationId);
    try {
      const updatedApplication = await jobService.updateApplicationStatus(applicationId, { status });
      const updatedJobContext =
        updatedApplication?.jobId && typeof updatedApplication.jobId === 'object'
          ? updatedApplication.jobId
          : null;
      const updatedJobId = updatedJobContext?._id ? String(updatedJobContext._id) : '';

      setApplications((current) =>
        current.map((application) => {
          if (application._id === applicationId) {
            return {
              ...updatedApplication,
              jobContext: updatedJobContext || application.jobContext || null,
            };
          }

          if (
            status === 'accepted_by_client' &&
            updatedJobId &&
            getApplicationJobId(application) === updatedJobId &&
            ['applied', 'verification', 'pending', 'shortlisted'].includes(
              normalizeApplicationStatus(application.status)
            )
          ) {
            return {
              ...application,
              status: 'rejected',
              jobContext: updatedJobContext || application.jobContext || null,
            };
          }

          return application;
        })
      );

      if (updatedJobContext?._id) {
        setJobs((current) =>
          current.map((job) =>
            job._id === updatedJobContext._id
              ? {
                  ...job,
                  status: updatedJobContext.status || job.status,
                  assignedWorkerId: updatedJobContext.assignedWorkerId || job.assignedWorkerId,
                }
              : job
          )
        );
      }

      showToast(successMessage);
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

  // ─── Razorpay checkout helpers ──────────────────────────────────────────────

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function launchRazorpayCheckout({ paymentRecord, title, payerName, payerEmail, payerPhone }) {
    return new Promise((resolve, reject) => {
      const normalizedPhone = String(payerPhone || '')
        .replace(/\D/g, '')
        .slice(-10);

      const options = {
        key: paymentRecord.razorpayKeyId,
        amount: Math.round(Number(paymentRecord.amount || 0) * 100),
        currency: paymentRecord.currency || 'INR',
        name: 'FindOne',
        description: title || 'Service payment',
        order_id: paymentRecord.razorpayOrderId,
        prefill: {
          name: payerName || '',
          email: payerEmail || '',
          contact: normalizedPhone || '',
        },
        method: {
          card: true,
          netbanking: true,
          upi: true,
          wallet: true,
        },
        theme: {
          color: '#6366F1',
        },
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () => resolve(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        const description = response.error?.description || 'Unknown error';
        if (description.toLowerCase().includes('no appropriate payment method found')) {
          showToast(
            'No payment method available for this account. Add valid client phone/email and enable methods in Razorpay dashboard.',
            'error'
          );
        } else {
          showToast(`Payment failed: ${description}`, 'error');
        }
        reject(new Error('Payment failed'));
      });
      rzp.open();
    });
  }

  async function handleDeletePostedJob(job) {
    const jobId = job?._id;

    if (!jobId || deletingJobId) {
      return;
    }

    if (!window.confirm(`Delete "${job.title}"? This will also remove its applications.`)) {
      return;
    }

    setDeletingJobId(jobId);

    try {
      await jobService.delete(jobId);
      setJobs((current) => current.filter((currentJob) => currentJob._id !== jobId));
      setApplications((current) =>
        current.filter((application) => getApplicationJobId(application) !== jobId)
      );
      showToast('Job deleted successfully');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to delete this job.'), 'error');
    } finally {
      setDeletingJobId('');
    }
  }

  function markApplicationJobPaymentStatus(jobId, paymentStatus) {
    if (!jobId) {
      return;
    }

    setJobs((current) =>
      current.map((job) =>
        job._id === jobId
          ? {
              ...job,
              paymentStatus,
            }
          : job
      )
    );
  }

  async function markPaymentFailed(paymentId) {
    if (!paymentId) {
      return;
    }

    try {
      await paymentService.updateStatus(paymentId, 'failed');
    } catch {
      // Best-effort status sync for retry UX.
    }
  }

  async function handlePayForApplication(application, jobContext) {
    if (!application?._id || !jobContext?._id || payingApplicationId) {
      return;
    }

    setPayingApplicationId(application._id);
    let paymentRecord = null;
    let verified = false;
    let shouldShowCatchToast = true;

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast('Could not load Razorpay checkout. Check your internet connection.', 'error');
        return;
      }

      const proposedRate = Number(application.proposedRate || 0);
      const fallbackAmount = Number(jobContext?.budgetMax || jobContext?.budgetMin || 0);
      const amountToPay = proposedRate > 0 ? proposedRate : fallbackAmount;
      if (amountToPay <= 0) {
        showToast('Set a valid amount before collecting payment for this application.', 'error');
        return;
      }

      paymentRecord = await paymentService.create({
        jobId: jobContext._id,
        workerId: application.workerId?._id,
        amount: amountToPay,
        mode: 'online',
      });

      const response = await launchRazorpayCheckout({
        paymentRecord,
        title: jobContext.title || 'Job payment',
        payerName: user?.fullName || '',
        payerEmail: user?.email || '',
        payerPhone: user?.phone || '',
      });

      if (!response) {
        shouldShowCatchToast = false;
        await markPaymentFailed(paymentRecord._id);
        markApplicationJobPaymentStatus(jobContext._id, 'failed');
        showToast('Online payment was not completed. You can retry online or mark cash payment.', 'error');
        return;
      }

      await paymentService.verify(paymentRecord._id, {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      verified = true;

      const updatedApplication = await jobService.updateApplicationStatus(application._id, {
        status: 'payment',
      });

      const updatedJobContext =
        updatedApplication?.jobId && typeof updatedApplication.jobId === 'object'
          ? updatedApplication.jobId
          : null;

      setApplications((current) =>
        current.map((item) =>
          item._id === application._id
            ? {
                ...updatedApplication,
                jobContext: updatedJobContext || item.jobContext || null,
              }
            : item
        )
      );

      const targetJobId = updatedJobContext?._id || jobContext._id;
      markApplicationJobPaymentStatus(targetJobId, 'paid');

      showToast('Payment successful. Application moved to payment step.');
    } catch (error) {
      if (!verified) {
        await markPaymentFailed(paymentRecord?._id);
        markApplicationJobPaymentStatus(jobContext._id, 'failed');
      }

      if (error?.message === 'Payment failed') {
        shouldShowCatchToast = false;
      }

      if (shouldShowCatchToast) {
        showToast(getErrorMessage(error, 'Payment could not be completed.'), 'error');
      }
    } finally {
      setPayingApplicationId('');
    }
  }

  async function handleCashPayForApplication(application, jobContext) {
    if (!application?._id || !jobContext?._id || payingApplicationId) {
      return;
    }

    setPayingApplicationId(application._id);

    try {
      const proposedRate = Number(application.proposedRate || 0);
      const fallbackAmount = Number(jobContext?.budgetMax || jobContext?.budgetMin || 0);
      const amountToPay = proposedRate > 0 ? proposedRate : fallbackAmount;
      if (amountToPay <= 0) {
        showToast('Set a valid amount before recording cash payment.', 'error');
        return;
      }

      await paymentService.create({
        jobId: jobContext._id,
        workerId: application.workerId?._id,
        amount: amountToPay,
        mode: 'cash',
      });

      const updatedApplication = await jobService.updateApplicationStatus(application._id, {
        status: 'payment',
      });

      const updatedJobContext =
        updatedApplication?.jobId && typeof updatedApplication.jobId === 'object'
          ? updatedApplication.jobId
          : null;

      setApplications((current) =>
        current.map((item) =>
          item._id === application._id
            ? {
                ...updatedApplication,
                jobContext: updatedJobContext || item.jobContext || null,
              }
            : item
        )
      );

      const targetJobId = updatedJobContext?._id || jobContext._id;
      markApplicationJobPaymentStatus(targetJobId, 'paid');

      showToast('Cash payment recorded. You can move to review.');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to record cash payment.'), 'error');
    } finally {
      setPayingApplicationId('');
    }
  }

  async function handlePayNow(booking) {
    if (!booking?._id || payingBookingId) {
      return;
    }

    setPayingBookingId(booking._id);
    let paymentRecord = null;
    let verified = false;
    let shouldShowCatchToast = true;

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast('Could not load Razorpay checkout. Check your internet connection.', 'error');
        return;
      }

      if (Number(booking.amount || 0) <= 0) {
        showToast('Set a valid booking amount before starting payment.', 'error');
        return;
      }

      paymentRecord = await paymentService.create({ bookingId: booking._id, mode: 'online' });
      const response = await launchRazorpayCheckout({
        paymentRecord: {
          ...paymentRecord,
          amount: paymentRecord.amount || booking.amount,
        },
        title: booking.title || 'Service payment',
        payerName: user?.fullName || '',
        payerEmail: user?.email || '',
        payerPhone: user?.phone || '',
      });

      if (!response) {
        shouldShowCatchToast = false;
        await markPaymentFailed(paymentRecord._id);
        setBookings((current) =>
          current.map((item) =>
            item._id === booking._id
              ? { ...item, paymentStatus: 'failed' }
              : item
          )
        );
        showToast('Online payment was not completed. You can retry online or mark cash payment.', 'error');
        return;
      }

      await paymentService.verify(paymentRecord._id, {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      verified = true;

      setBookings((current) =>
        current.map((item) =>
          item._id === booking._id
            ? { ...item, paymentStatus: 'paid' }
            : item
        )
      );

      showToast('Payment successful.');
    } catch (error) {
      if (!verified) {
        await markPaymentFailed(paymentRecord?._id);
        setBookings((current) =>
          current.map((item) =>
            item._id === booking._id
              ? { ...item, paymentStatus: 'failed' }
              : item
          )
        );
      }

      if (error?.message === 'Payment failed') {
        shouldShowCatchToast = false;
      }

      if (shouldShowCatchToast) {
        showToast(getErrorMessage(error, 'Payment could not be initiated.'), 'error');
      }
    } finally {
      setPayingBookingId('');
    }
  }

  async function handleCashPayNow(booking) {
    if (!booking?._id || payingBookingId) {
      return;
    }

    setPayingBookingId(booking._id);

    try {
      if (Number(booking.amount || 0) <= 0) {
        showToast('Set a valid booking amount before recording cash payment.', 'error');
        return;
      }

      await paymentService.create({ bookingId: booking._id, mode: 'cash' });
      setBookings((current) =>
        current.map((item) =>
          item._id === booking._id
            ? { ...item, paymentStatus: 'paid' }
            : item
        )
      );
      showToast('Cash payment recorded. You can add review now.');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to record cash payment.'), 'error');
    } finally {
      setPayingBookingId('');
    }
  }
  function closeReviewModal() {
    if (submittingReview) {
      return;
    }

    setSelectedBooking(null);
    setReviewForm({ rating: 5, comment: '' });
  }

  async function handleSubmitReview(event) {
    event.preventDefault();
    if (!selectedBooking?._id) {
      return;
    }

    setSubmittingReview(true);

    try {
      const review = await bookingService.createReview(selectedBooking._id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });

      setBookings((current) =>
        current.map((booking) =>
          booking._id === selectedBooking._id
            ? {
                ...booking,
                review,
              }
            : booking
        )
      );

      showToast('Review submitted successfully');
      closeReviewModal();
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to submit review.'), 'error');
    } finally {
      setSubmittingReview(false);
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
            Welcome back, {user?.fullName?.split(' ')[0] || 'Client'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track your jobs, bookings, and worker activity
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/dashboard/workers">
            <Button variant="ghost" size="lg">
              Find workers
            </Button>
          </Link>
          <Link to="/jobs">
            <Button variant="primary" size="lg">
              Post or browse jobs
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">{label}</span>
            </div>
            <span className="text-2xl font-bold text-dark">{value}</span>
          </div>
        ))}
      </div>

      {canEditClientLocation && (
      <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Your hiring location</h3>
            <p className="mt-1 text-sm text-slate-500">
              Workers near this saved location will be shown first in Find Workers.
            </p>
          </div>
          <Link to="/dashboard/workers">
            <Button variant="ghost" size="sm">
              Find nearby workers
            </Button>
          </Link>
        </div>

        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleClientProfileSubmit}>
          <input
            type="text"
            placeholder="Company name"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={clientProfileForm.companyName}
            onChange={(event) =>
              setClientProfileForm((current) => ({ ...current, companyName: event.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Address label, e.g. Home or Office"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={clientProfileForm.address}
            onChange={(event) =>
              setClientProfileForm((current) => ({ ...current, address: event.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Address line"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
            value={clientProfileForm.locationAddressLine}
            onChange={(event) =>
              setClientProfileForm((current) => ({
                ...current,
                locationAddressLine: event.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="City"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={clientProfileForm.locationCity}
            onChange={(event) =>
              setClientProfileForm((current) => ({ ...current, locationCity: event.target.value }))
            }
          />
          <input
            type="text"
            placeholder="State"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={clientProfileForm.locationState}
            onChange={(event) =>
              setClientProfileForm((current) => ({ ...current, locationState: event.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Pincode"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={clientProfileForm.locationPincode}
            onChange={(event) =>
              setClientProfileForm((current) => ({ ...current, locationPincode: event.target.value }))
            }
          />
          <input
            type="text"
            readOnly
            placeholder="Coordinates"
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            value={
              clientProfileForm.locationLat && clientProfileForm.locationLng
                ? `${clientProfileForm.locationLat}, ${clientProfileForm.locationLng}`
                : ''
            }
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={fetchingClientLocation}
              onClick={handleUseCurrentClientLocation}
            >
              <MapPin size={16} />
              Use current location
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingClientProfile}>
              Save location
            </Button>
          </div>
        </form>
      </section>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent jobs</h3>
              <p className="mt-1 text-sm text-slate-500">Jobs created from your client account</p>
            </div>
            <Link to="/jobs">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {jobs.length > 0 ? (
              jobs.slice(0, 4).map((job) => (
                <article key={job._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.categoryId?.name || 'General'} - {job.location?.city}, {job.location?.state}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <div className="flex flex-wrap gap-4">
                      <span>{formatCurrency(job.budgetMax || job.budgetMin)}</span>
                      <span>{job.applicationCount || 0} applications</span>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      loading={deletingJobId === job._id}
                      onClick={() => handleDeletePostedJob(job)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No jobs posted yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent bookings</h3>
              <p className="mt-1 text-sm text-slate-500">Bookings made directly with workers</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {bookings.length > 0 ? (
              bookings.slice(0, 4).map((booking) => (
                <article key={booking._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.workerId?.fullName || 'Worker'} - {formatDate(booking.bookingDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span>{formatCurrency(booking.amount)}</span>
                    <span>{booking.paymentStatus} payment</span>
                    {booking.review ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                        <Star size={13} className="fill-current" />
                        Rated {booking.review.rating}/5
                      </span>
                    ) : booking.status === 'completed' ? (
                      <Button variant="outline" size="sm" onClick={() => openReviewModal(booking)}>
                        Rate worker
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No bookings yet.
              </div>
            )}
          </div>
        </section>
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
            Application workflow ({trackedApplications.length})
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
            Booking workflow ({trackedBookings.length})
          </button>
        </div>
      </section>

      {activeWorkflowTab === 'applications' ? (
      <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ListChecks size={18} className="text-slate-500" />
              Application workflow
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Move workers through verification, acceptance, and completion from one place.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {visibleTrackedApplications.length} shown / {trackedApplications.length} total
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filter applicants by posted job
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setApplicationJobFilter('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                applicationJobFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              All jobs ({trackedApplications.length})
            </button>
            {applicationJobSummaries.map(({ job, count }) => (
              <button
                key={`application-job-filter-${job._id}`}
                type="button"
                onClick={() => setApplicationJobFilter(String(job._id))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  applicationJobFilter === String(job._id)
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {job.title} ({count})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 max-h-[36rem] space-y-4 overflow-y-auto pr-1">
          {visibleTrackedApplications.length > 0 ? (
            visibleTrackedApplications.map(({ application, tracking, jobContext, primaryAction, secondaryAction, lastUpdatedAt }) => {
              const workerProfilePath = getWorkerProfilePath(application);
              const showProfileLink = Boolean(workerProfilePath);
              const isVerificationStep = ['applied', 'verification'].includes(tracking.normalizedStatus);
              const paymentStatus = jobContext?.paymentStatus || 'pending';
              const canPayNow =
                ['work_completed', 'payment'].includes(tracking.normalizedStatus) &&
                ['pending', 'failed'].includes(paymentStatus) &&
                Boolean(jobContext?._id);
              const canMarkCashPayment =
                ['work_completed', 'payment'].includes(tracking.normalizedStatus) &&
                ['pending', 'failed'].includes(paymentStatus) &&
                Boolean(jobContext?._id);
              const isPaymentPending =
                ['work_completed', 'payment'].includes(tracking.normalizedStatus) &&
                paymentStatus === 'authorized';
              const canMoveToReview = tracking.normalizedStatus === 'payment' && paymentStatus === 'paid';
              const hasAction =
                Boolean(primaryAction) ||
                Boolean(secondaryAction) ||
                canPayNow ||
                canMarkCashPayment ||
                isPaymentPending ||
                canMoveToReview;

              return (
                <article key={application._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{jobContext?.title || 'Job'}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {jobContext?.categoryId?.name || 'General'} - {jobContext?.location?.city || 'City'},{' '}
                        {jobContext?.location?.state || 'State'}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Worker: <span className="font-medium">{application.workerId?.fullName || 'Worker'}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Account:{' '}
                        <span className={application.workerId?.isVerified ? 'text-emerald-700' : 'text-amber-700'}>
                          {application.workerId?.isVerified ? 'Verified' : 'Not verified'}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusToneClass(
                        tracking.normalizedStatus
                      )}`}
                    >
                      {STATUS_LABELS[tracking.normalizedStatus] || STATUS_LABELS.applied}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span>{formatCurrency(application.proposedRate)}</span>
                    <span>{paymentStatus} payment</span>
                    <span>
                      Step {Math.max(1, tracking.lastReachedStepIndex + 1)} of {APPLICATION_TRACKING_STEPS.length}
                    </span>
                    <span>Updated {formatDateTime(lastUpdatedAt)}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                    {APPLICATION_TRACKING_STEPS.map((step, index) => {
                      const isCurrent =
                        !tracking.isTerminal &&
                        tracking.currentStepIndex >= 0 &&
                        tracking.currentStepIndex === index;
                      const isReached = index <= tracking.lastReachedStepIndex;

                      return (
                        <div
                          key={`${application._id}-${step.key}`}
                          className={`rounded-lg border px-2 py-1.5 text-xs ${
                            isCurrent
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : isReached
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {showProfileLink ? (
                        <Link to={workerProfilePath}>
                          <Button variant={isVerificationStep ? 'primary' : 'ghost'} size="sm">
                            View worker profile
                          </Button>
                        </Link>
                      ) : null}

                      {primaryAction ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={updatingApplicationId === application._id}
                          onClick={() =>
                            handleUpdateApplicationStatus(
                              application._id,
                              primaryAction.targetStatus,
                              `${primaryAction.label} updated successfully`
                            )
                          }
                        >
                          {primaryAction.label}
                        </Button>
                      ) : null}

                      {canPayNow ? (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={payingApplicationId === application._id}
                          onClick={() => handlePayForApplication(application, jobContext)}
                        >
                          Pay online
                        </Button>
                      ) : null}

                      {canMarkCashPayment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={payingApplicationId === application._id}
                          onClick={() => handleCashPayForApplication(application, jobContext)}
                        >
                          Pay cash
                        </Button>
                      ) : null}

                      {isPaymentPending ? (
                        <span className="text-xs text-slate-400">Payment is in progress from checkout.</span>
                      ) : null}

                      {canMoveToReview ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={updatingApplicationId === application._id}
                          onClick={() =>
                            handleUpdateApplicationStatus(
                              application._id,
                              'review',
                              'Application moved to review step'
                            )
                          }
                        >
                          Move to review
                        </Button>
                      ) : null}

                      {secondaryAction ? (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={updatingApplicationId === application._id}
                          onClick={() =>
                            handleUpdateApplicationStatus(
                              application._id,
                              secondaryAction.targetStatus,
                              `${secondaryAction.label} updated successfully`
                            )
                          }
                        >
                          {secondaryAction.label}
                        </Button>
                      ) : null}

                      {!hasAction ? (
                        <span className="text-xs text-slate-400">No client action required at this step.</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              {applicationJobFilter !== 'all' && selectedApplicationJob
                ? `No workers have applied to "${selectedApplicationJob.title}" yet.`
                : trackedApplications.length > 0
                ? 'No applications found for this selected job.'
                : 'No applications received yet.'}
            </div>
          )}
        </div>
      </section>
      ) : (
      <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ListChecks size={18} className="text-slate-500" />
              Booking workflow
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Track booked workers through confirmation, execution, completion, and payment.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {trackedBookings.length} bookings
          </span>
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
              placeholder="Search by booking title, worker, or city"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {TRACKER_FILTERS.map((filter) => (
              <button
                key={`client-booking-filter-${filter.key}`}
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

        <div className="mt-5 max-h-[36rem] space-y-4 overflow-y-auto pr-1">
          {filteredBookings.length > 0 ? (
            filteredBookings.map(({ booking, tracking, primaryAction, progressPercent, lastUpdatedAt }) => {
              const workerProfilePath = getBookingWorkerProfilePath(booking);
              const canViewProfile = Boolean(workerProfilePath);
              const canCancel = ['pending', 'confirmed'].includes(booking.status);

              return (
                <article key={booking._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{booking.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Worker: {booking.workerId?.fullName || 'Worker'} - {formatDate(booking.bookingDate)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.address?.city || 'City'}, {booking.address?.state || 'State'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingStatusToneClass(
                        tracking.normalizedStatus
                      )}`}
                    >
                      {BOOKING_STATUS_LABELS[tracking.normalizedStatus] || BOOKING_STATUS_LABELS.booked_by_client}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span>{formatCurrency(booking.amount)}</span>
                    <span>{booking.paymentStatus} payment</span>
                    <span>
                      Step {tracking.stepNumber} of {BOOKING_TRACKING_STEPS.length}
                    </span>
                    <span>Updated {formatDateTime(lastUpdatedAt)}</span>
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
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                    {BOOKING_TRACKING_STEPS.map((step, index) => {
                      const isCurrent =
                        !tracking.isTerminal &&
                        tracking.currentStepIndex >= 0 &&
                        tracking.currentStepIndex === index;
                      const isReached = index <= tracking.lastReachedStepIndex;

                      return (
                        <div
                          key={`${booking._id}-${step.key}`}
                          className={`rounded-lg border px-2 py-1.5 text-xs ${
                            isCurrent
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : isReached
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {canViewProfile ? (
                      <Link to={workerProfilePath}>
                        <Button variant="ghost" size="sm">
                          View worker profile
                        </Button>
                      </Link>
                    ) : null}

                    {primaryAction ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={updatingBookingId === booking._id}
                        onClick={() =>
                          handleUpdateBookingStatus(
                            booking._id,
                            primaryAction.targetStatus,
                            `${primaryAction.label} updated successfully`
                          )
                        }
                      >
                        {primaryAction.label}
                      </Button>
                    ) : null}

                    {canCancel ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancellingBookingId === booking._id}
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        Cancel booking
                      </Button>
                    ) : null}

                    {/* Payment actions for completed bookings */}
                    {booking.status === 'completed' &&
                      (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') ? (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={payingBookingId === booking._id}
                        onClick={() => handlePayNow(booking)}
                      >
                        Pay online
                      </Button>
                    ) : null}

                    {booking.status === 'completed' &&
                      (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={payingBookingId === booking._id}
                        onClick={() => handleCashPayNow(booking)}
                      >
                        Pay cash
                      </Button>
                    ) : null}

                    {!primaryAction && !canCancel && booking.status === 'completed' && !booking.review &&
                      booking.paymentStatus === 'paid' ? (
                      <Button variant="outline" size="sm" onClick={() => openReviewModal(booking)}>
                        Rate worker
                      </Button>
                    ) : null}

                    {!primaryAction && !canCancel &&
                      !(booking.status === 'completed') ? (
                      <span className="text-xs text-slate-400">No client action required at this step.</span>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : bookings.length > 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              No bookings matched your search or filter.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              No bookings yet.
            </div>
          )}
        </div>
      </section>
      )}

      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={closeReviewModal}
        title={selectedBooking ? `Rate ${selectedBooking.workerId?.fullName || 'worker'}` : 'Add review'}
      >
        <form className="space-y-4" onSubmit={handleSubmitReview}>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Your rating</p>
            <StarPicker
              value={reviewForm.rating}
              onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Comment</label>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              placeholder="Share your experience"
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((current) => ({ ...current, comment: event.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={closeReviewModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submittingReview}>
              Submit review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
