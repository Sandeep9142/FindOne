import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, LogOut, MapPin } from 'lucide-react';
import Button from '@components/common/Button';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@config/constants';
import { categoryService, workerService } from '@services';
import { useAuthStore, useUIStore } from '@store';
import { getBrowserLocation } from '@utils';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function getInitials(fullName) {
  return String(fullName || 'Worker')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function buildProfileForm(workerProfile, currentUser) {
  const account = workerProfile?.userId || currentUser || {};
  const hourlyRate = Number(workerProfile?.hourlyRate || 0);
  const experienceYears = Number(workerProfile?.experienceYears || 0);
  const serviceArea = workerProfile?.serviceAreas?.[0] || {};

  return {
    fullName: account?.fullName || '',
    phone: account?.phone || '',
    headline: workerProfile?.headline || '',
    bio: workerProfile?.bio || '',
    skills: (workerProfile?.skills || []).join(', '),
    hourlyRate: hourlyRate > 0 ? String(hourlyRate) : '',
    experienceYears: experienceYears > 0 ? String(experienceYears) : '',
    categoryIds: (workerProfile?.categories || []).map((category) => category._id),
    serviceAddressLine: serviceArea.addressLine || '',
    serviceCity: serviceArea.city || '',
    serviceState: serviceArea.state || '',
    servicePincode: serviceArea.pincode || '',
    serviceLat: serviceArea.lat ?? '',
    serviceLng: serviceArea.lng ?? '',
  };
}

export default function WorkerProfilePage() {
  const hasLoadedRef = useRef(false);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const showToast = useUIStore((state) => state.showToast);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    headline: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    experienceYears: '',
    categoryIds: [],
    serviceAddressLine: '',
    serviceCity: '',
    serviceState: '',
    servicePincode: '',
    serviceLat: '',
    serviceLng: '',
  });

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [workerProfile, categoryList] = await Promise.all([
          workerService.getMyProfile(),
          categoryService.getAll(),
        ]);

        setProfile(workerProfile);
        setCategories(categoryList);
        setProfileForm(buildProfileForm(workerProfile, user));
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load profile data.'), 'error');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [showToast, user]);

  function toggleCategory(categoryId) {
    setProfileForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast('Please upload JPG, PNG, or WEBP image.', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast('Profile image must be 5MB or smaller.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const updatedUser = await workerService.uploadAvatar(formData);
      updateUser(updatedUser);
      setProfile((current) =>
        current
          ? {
              ...current,
              userId: {
                ...(current.userId || {}),
                ...updatedUser,
              },
            }
          : current
      );
      showToast('Profile photo uploaded successfully');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to upload profile photo.'), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleUseCurrentLocation() {
    setFetchingLocation(true);

    try {
      const location = await getBrowserLocation();
      setProfileForm((current) => ({
        ...current,
        serviceLat: location.lat,
        serviceLng: location.lng,
      }));
      showToast('Current location captured. Add city/state if they are empty.');
    } catch (error) {
      showToast(error.message || 'Unable to fetch current location.', 'error');
    } finally {
      setFetchingLocation(false);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const serviceArea = {
        addressLine: profileForm.serviceAddressLine.trim(),
        city: profileForm.serviceCity.trim(),
        state: profileForm.serviceState.trim(),
        pincode: profileForm.servicePincode.trim(),
        lat: profileForm.serviceLat === '' ? null : Number(profileForm.serviceLat),
        lng: profileForm.serviceLng === '' ? null : Number(profileForm.serviceLng),
      };
      const hasServiceArea = Object.values(serviceArea).some((value) => value !== '' && value !== null);
      const [updatedProfile, updatedAccount] = await Promise.all([
        workerService.updateProfile({
          headline: profileForm.headline,
          bio: profileForm.bio,
          skills: profileForm.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
          hourlyRate: Number(profileForm.hourlyRate || 0),
          experienceYears: Number(profileForm.experienceYears || 0),
          categories: profileForm.categoryIds,
          serviceAreas: hasServiceArea ? [serviceArea] : [],
        }),
        workerService.updateAccountInfo({
          fullName: profileForm.fullName,
          phone: profileForm.phone || '',
        }),
      ]);

      setProfile(updatedProfile);
      setProfileForm(buildProfileForm(updatedProfile, updatedAccount));
      updateUser(updatedAccount);
      showToast('Profile updated successfully');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update your profile.'), 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    showToast('Logged out successfully');
    navigate('/login');
    setLoggingOut(false);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">Profile Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your worker profile and personal details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/worker/${profile?._id || ''}`}>
            <Button variant="ghost" size="lg">
              View public profile
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            loading={loggingOut}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              {profile?.userId?.avatarUrl ? (
                <img
                  src={profile.userId.avatarUrl}
                  alt={profileForm.fullName || 'Worker avatar'}
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-semibold text-slate-600">
                  {getInitials(profileForm.fullName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{profileForm.fullName || 'Worker'}</p>
                <p className="truncate text-xs text-slate-500">{profile?.userId?.email || user?.email}</p>
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full justify-center"
              loading={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera size={16} />
              Upload profile photo
            </Button>
            <p className="mt-2 text-xs text-slate-500">JPG, PNG, WEBP up to 5MB</p>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Availability</h3>
            <p className="mt-2 text-sm text-slate-500">Use the status toggle on the Overview page to set online/offline.</p>
          </section>
        </aside>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <form className="space-y-6" onSubmit={handleProfileSubmit}>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Personal info</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full name"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  value={profileForm.fullName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Phone number"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
                <input
                  type="email"
                  value={profile?.userId?.email || user?.email || ''}
                  disabled
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 md:col-span-2"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Work details</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
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

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Hourly rate (Rs per hour)</p>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                    value={profileForm.hourlyRate}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, hourlyRate: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Experience (years)</p>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                    value={profileForm.experienceYears}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, experienceYears: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Service location</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Clients nearby this area will see your profile first.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={fetchingLocation}
                  onClick={handleUseCurrentLocation}
                >
                  <MapPin size={16} />
                  Use current location
                </Button>
              </div>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Address line"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
                  value={profileForm.serviceAddressLine}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, serviceAddressLine: event.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="City"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  value={profileForm.serviceCity}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, serviceCity: event.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="State"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  value={profileForm.serviceState}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, serviceState: event.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  value={profileForm.servicePincode}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, servicePincode: event.target.value }))
                  }
                />
                <input
                  type="text"
                  readOnly
                  placeholder="Coordinates"
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                  value={
                    profileForm.serviceLat && profileForm.serviceLng
                      ? `${profileForm.serviceLat}, ${profileForm.serviceLng}`
                      : ''
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Service categories</h3>
              <div className="mt-3 flex flex-wrap gap-2">
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

            <div>
              <Button type="submit" variant="primary" size="lg" loading={savingProfile}>
                Save profile
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
