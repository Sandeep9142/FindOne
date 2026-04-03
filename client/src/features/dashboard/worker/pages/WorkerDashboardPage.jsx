import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, DollarSign, Star, TrendingUp } from 'lucide-react';
import Button from '@components/common/Button';
import { bookingService, categoryService, jobService, workerService } from '@services';
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

function buildProfileForm(workerProfile) {
  return {
    headline: workerProfile?.headline || '',
    bio: workerProfile?.bio || '',
    skills: (workerProfile?.skills || []).join(', '),
    hourlyRate: String(workerProfile?.hourlyRate ?? ''),
    experienceYears: String(workerProfile?.experienceYears ?? ''),
    isAvailableNow: Boolean(workerProfile?.isAvailableNow),
    categoryIds: (workerProfile?.categories || []).map((category) => category._id),
  };
}

export default function WorkerDashboardPage() {
  const hasLoadedRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    headline: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    experienceYears: '',
    isAvailableNow: false,
    categoryIds: [],
  });

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [workerProfile, categoryList, appliedJobs, bookingList] = await Promise.all([
          workerService.getMyProfile(),
          categoryService.getAll(),
          jobService.getMyApplied(),
          bookingService.getAll(),
        ]);

        setProfile(workerProfile);
        setCategories(categoryList);
        setProfileForm(buildProfileForm(workerProfile));
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

  function toggleCategory(categoryId) {
    setProfileForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const updatedProfile = await workerService.updateProfile({
        headline: profileForm.headline,
        bio: profileForm.bio,
        skills: profileForm.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        hourlyRate: Number(profileForm.hourlyRate || 0),
        experienceYears: Number(profileForm.experienceYears || 0),
        isAvailableNow: profileForm.isAvailableNow,
        categories: profileForm.categoryIds,
      });

      setProfile(updatedProfile);
      setProfileForm(buildProfileForm(updatedProfile));
      showToast('Profile updated successfully');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update your profile.'), 'error');
    } finally {
      setSavingProfile(false);
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
          <p className="text-sm text-slate-500 mt-1">
            Track applications, bookings, and your profile performance
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

      <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Edit worker profile</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update your skills, amount, and service type so clients can find you faster.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleProfileSubmit}>
          <input
            type="text"
            placeholder="Headline"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
            value={profileForm.headline}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, headline: event.target.value }))
            }
          />

          <textarea
            placeholder="Bio"
            className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
            value={profileForm.bio}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, bio: event.target.value }))
            }
          />

          <input
            type="text"
            placeholder="Skills (comma separated)"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
            value={profileForm.skills}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, skills: event.target.value }))
            }
          />

          <input
            type="number"
            min="0"
            placeholder="Amount (hourly rate)"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={profileForm.hourlyRate}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, hourlyRate: event.target.value }))
            }
          />

          <input
            type="number"
            min="0"
            placeholder="Experience in years"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            value={profileForm.experienceYears}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, experienceYears: event.target.value }))
            }
          />

          <div className="md:col-span-2">
            <p className="text-sm font-medium text-slate-700">Service type (categories)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const selected = profileForm.categoryIds.includes(category._id);
                  return (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => toggleCategory(category._id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No categories available yet.</p>
              )}
            </div>
          </div>

          <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={profileForm.isAvailableNow}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, isAvailableNow: event.target.checked }))
              }
            />
            Available now
          </label>

          <div className="md:col-span-2">
            <Button type="submit" variant="primary" size="lg" loading={savingProfile}>
              Save profile
            </Button>
          </div>
        </form>
      </section>

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
                        {application.jobId?.categoryId?.name || 'General'} - {application.jobId?.location?.city}, {application.jobId?.location?.state}
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
