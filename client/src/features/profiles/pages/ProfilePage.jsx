import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import Button from '@components/common/Button';
import { bookingService, messageService, workerService } from '@services';
import { useAuthStore, useUIStore } from '@store';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatDate(value) {
  if (!value) {
    return 'Flexible';
  }

  return new Date(value).toLocaleString();
}

export default function ProfilePage() {
  const { id } = useParams();
  const loadedWorkerIdRef = useRef('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const showToast = useUIStore((state) => state.showToast);
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    bookingDate: '',
    timeSlot: '',
    amount: '',
    city: '',
    state: '',
    addressLine: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    if (loadedWorkerIdRef.current === id) {
      return;
    }

    loadedWorkerIdRef.current = id;

    async function bootstrap() {
      setLoading(true);
      setError('');

      try {
        const [workerProfile, workerReviews] = await Promise.all([
          workerService.getById(id),
          workerService.getReviews(id),
        ]);

        setWorker(workerProfile);
        setReviews(workerReviews);
        setBookingForm((current) => ({
          ...current,
          categoryId: current.categoryId || workerProfile.categories?.[0]?._id || '',
          title: current.title || `Book ${workerProfile.userId?.fullName || 'worker'}`,
          amount: current.amount || String(workerProfile.hourlyRate || ''),
        }));
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load this worker profile.'));
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [id]);

  async function handleBookingSubmit(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (user?.role !== 'client' && user?.role !== 'admin') {
      showToast('Only client accounts can create bookings.', 'error');
      return;
    }

    if (!worker?.userId?._id) {
      showToast('Worker account is not ready for bookings yet.', 'error');
      return;
    }

    setBookingLoading(true);

    try {
      await bookingService.create({
        workerId: worker.userId._id,
        categoryId: bookingForm.categoryId,
        title: bookingForm.title,
        description: bookingForm.description,
        bookingDate: new Date(bookingForm.bookingDate).toISOString(),
        timeSlot: bookingForm.timeSlot,
        pricingType: 'fixed',
        amount: Number(bookingForm.amount || 0),
        address: {
          addressLine: bookingForm.addressLine,
          city: bookingForm.city,
          state: bookingForm.state,
          pincode: bookingForm.pincode,
        },
        notes: bookingForm.notes,
      });

      showToast('Booking created successfully');
      setBookingForm((current) => ({
        ...current,
        description: '',
        bookingDate: '',
        timeSlot: '',
        city: '',
        state: '',
        addressLine: '',
        pincode: '',
        notes: '',
      }));
    } catch (bookingError) {
      showToast(getErrorMessage(bookingError, 'Unable to create booking.'), 'error');
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleStartConversation() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!worker?.userId?._id) {
      showToast('Unable to start a conversation right now.', 'error');
      return;
    }

    setMessageLoading(true);

    try {
      const conversation = await messageService.createConversation({
        participantId: worker.userId._id,
      });
      navigate(`/dashboard/messages?conversation=${conversation._id}`);
    } catch (conversationError) {
      showToast(getErrorMessage(conversationError, 'Unable to open conversation.'), 'error');
    } finally {
      setMessageLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container-app py-28">
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
          Loading worker profile...
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="container-app py-28">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-600">
          {error || 'Worker profile not found.'}
        </div>
      </div>
    );
  }

  const displayName = worker.userId?.fullName || 'Worker';
  const workerUserId = worker.userId?._id;
  const isOwnProfile = user?._id && workerUserId && user._id === workerUserId;

  return (
    <div className="container-app py-28">
      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-primary-100 text-2xl font-bold text-primary-700">
                {worker.userId?.avatarUrl ? (
                  <img
                    src={worker.userId.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  displayName.slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
                  {worker.userId?.isVerified && (
                    <ShieldCheck size={20} className="text-emerald-500" />
                  )}
                </div>
                <p className="mt-2 text-lg text-slate-500">
                  {worker.headline || 'Skilled local professional'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    <Star size={14} className="fill-current" />
                    {worker.ratingAverage?.toFixed?.(1) || '0.0'} ({worker.ratingCount || 0} reviews)
                  </span>
                  <span>Rs {worker.hourlyRate || 0}/hr</span>
                  <span>{worker.experienceYears || 0} years experience</span>
                  <span>{worker.isAvailableNow ? 'Available now' : 'Schedule ahead'}</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleStartConversation}
                  loading={messageLoading}
                >
                  <MessageSquare size={16} />
                  Message
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Book now
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {worker.bio || 'This worker has not added a detailed bio yet.'}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">Service areas</h2>
              <div className="mt-3 space-y-2">
                {(worker.serviceAreas || []).length > 0 ? (
                  worker.serviceAreas.map((area, index) => (
                    <div key={`${area.city}-${area.state}-${index}`} className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={15} className="text-primary-500" />
                      {area.city}, {area.state}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Service area will be shared during booking.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(worker.categories || []).map((category) => (
                <span
                  key={category._id}
                  className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(worker.skills || []).length > 0 ? (
                worker.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">Skills will appear here once the profile is updated.</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Portfolio</h2>
            {(worker.portfolioImages || []).length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {worker.portfolioImages.map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={displayName}
                    className="h-48 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Portfolio images will show up here.</p>
            )}
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent reviews</h2>
              <span className="text-sm text-slate-500">{reviews.length} loaded</span>
            </div>

            <div className="mt-4 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article key={review._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.clientId?.fullName || 'Client'}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        <Star size={14} className="fill-current" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {review.comment || 'Great experience.'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                  No reviews yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <CalendarDays size={18} className="text-primary-500" />
            <h2 className="text-xl font-semibold">Create booking</h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Book this worker directly from the profile page. This form is connected to the backend
            booking API.
          </p>

          {!isAuthenticated ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-600">Log in as a client to create a booking.</p>
              <Button
                className="mt-4"
                variant="primary"
                size="lg"
                onClick={() => navigate('/login', { state: { from: location } })}
              >
                Log in
              </Button>
            </div>
          ) : isOwnProfile ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              This is your own worker profile.
            </div>
          ) : (
            <form id="booking-form" className="mt-6 space-y-4" onSubmit={handleBookingSubmit}>
              <select
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.categoryId}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, categoryId: event.target.value }))
                }
              >
                {(worker.categories || []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                placeholder="Booking title"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.title}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, title: event.target.value }))
                }
              />

              <textarea
                placeholder="Describe the work needed"
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.description}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, description: event.target.value }))
                }
              />

              <input
                type="datetime-local"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.bookingDate}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, bookingDate: event.target.value }))
                }
              />

              <input
                type="text"
                placeholder="Preferred time slot"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.timeSlot}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, timeSlot: event.target.value }))
                }
              />

              <input
                type="number"
                min="0"
                required
                placeholder="Amount"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.amount}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, amount: event.target.value }))
                }
              />

              <input
                type="text"
                required
                placeholder="City"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.city}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, city: event.target.value }))
                }
              />

              <input
                type="text"
                required
                placeholder="State"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.state}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, state: event.target.value }))
                }
              />

              <input
                type="text"
                placeholder="Address line"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.addressLine}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, addressLine: event.target.value }))
                }
              />

              <input
                type="text"
                placeholder="Pincode"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.pincode}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, pincode: event.target.value }))
                }
              />

              <textarea
                placeholder="Additional notes"
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                value={bookingForm.notes}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, notes: event.target.value }))
                }
              />

              <Button type="submit" variant="primary" size="lg" loading={bookingLoading}>
                Confirm booking
              </Button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
