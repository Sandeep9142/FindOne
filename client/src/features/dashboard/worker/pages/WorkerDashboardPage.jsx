import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, DollarSign, Star, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import Button from '@components/common/Button';
import { bookingService, jobService, workerService } from '@services';
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

export default function WorkerDashboardPage() {
  const hasLoadedRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [workerProfile, appliedJobs, bookingList] = await Promise.all([
          workerService.getMyProfile(),
          jobService.getMyApplied(),
          bookingService.getAll(),
        ]);

        setProfile(workerProfile);
        setApplications(appliedJobs);
        setBookings(bookingList);
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
        bookings
          .filter((booking) => booking.status === 'completed')
          .reduce((sum, booking) => sum + Number(booking.amount || 0), 0)
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

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Applied jobs</h3>
              <p className="mt-1 text-sm text-slate-500">Your latest applications from the jobs page</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {applications.length > 0 ? (
              applications.slice(0, 4).map((application) => (
                <article key={application._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{application.jobId?.title || 'Job'}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {application.jobId?.categoryId?.name || 'General'} - {application.jobId?.location?.city},{' '}
                        {application.jobId?.location?.state}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{formatCurrency(application.proposedRate)}</span>
                    <span>{application.jobId?.clientId?.fullName || 'Client'}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No job applications yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Bookings</h3>
              <p className="mt-1 text-sm text-slate-500">Confirmed and upcoming client work</p>
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
                        {booking.clientId?.fullName || 'Client'} - {formatDate(booking.bookingDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{formatCurrency(booking.amount)}</span>
                    <span>{booking.paymentStatus} payment</span>
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
    </div>
  );
}
