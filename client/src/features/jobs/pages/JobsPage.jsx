import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Search } from 'lucide-react';
import Button from '@components/common/Button';
import { categoryService, jobService } from '@services';
import { useAuthStore, useUIStore } from '@store';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatBudget(job) {
  const min = Number(job.budgetMin || 0);
  const max = Number(job.budgetMax || 0);
  const unit = job.budgetType === 'hourly' ? '/hr' : '';

  if (min && max && min !== max) {
    return `Rs ${min} - Rs ${max}${unit}`;
  }

  return `Rs ${max || min || 0}${unit}`;
}

export default function JobsPage() {
  const hasLoadedRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const showToast = useUIStore((state) => state.showToast);
  const isWorker = user?.role === 'worker';
  const isClientOrAdmin = user?.role === 'client' || user?.role === 'admin';
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyingId, setApplyingId] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    categoryId: '',
    openOnly: true,
  });
  const [jobForm, setJobForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    budgetType: 'fixed',
    budgetMin: '',
    budgetMax: '',
    urgency: 'medium',
    scheduledDate: '',
    skillsRequired: '',
  });

  function validateJobForm() {
    if (!jobForm.categoryId) {
      return 'Please select a category.';
    }

    if (jobForm.title.trim().length < 3) {
      return 'Job title must be at least 3 characters.';
    }

    if (jobForm.description.trim().length < 10) {
      return 'Job description must be at least 10 characters.';
    }

    if (!jobForm.city.trim() || !jobForm.state.trim()) {
      return 'City and state are required.';
    }

    const budgetMin = Number(jobForm.budgetMin || 0);
    const budgetMax = Number(jobForm.budgetMax || 0);

    if (Number.isNaN(budgetMin) || Number.isNaN(budgetMax)) {
      return 'Budget values must be valid numbers.';
    }

    if (budgetMin < 0 || budgetMax < 0) {
      return 'Budget values cannot be negative.';
    }

    if (!budgetMin && !budgetMax) {
      return 'Please enter at least one budget amount.';
    }

    if (budgetMin && budgetMax && budgetMax < budgetMin) {
      return 'Budget maximum must be greater than or equal to budget minimum.';
    }

    return '';
  }

  async function loadJobs(currentFilters = filters) {
    setLoading(true);
    setError('');

    try {
      const result = await jobService.getAll({
        q: currentFilters.q || undefined,
        categoryId: currentFilters.categoryId || undefined,
        openOnly: currentFilters.openOnly ? 'true' : undefined,
        limit: 24,
      });
      setJobs(result);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load jobs right now.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [categoryList, jobList] = await Promise.all([
          categoryService.getAll(),
          jobService.getAll({ openOnly: 'true', limit: 24 }),
        ]);
        setCategories(categoryList);
        setJobs(jobList);
        if (categoryList[0]) {
          setJobForm((current) => ({ ...current, categoryId: categoryList[0]._id }));
        }
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load jobs right now.'));
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  function handleFilterSubmit(event) {
    event.preventDefault();
    loadJobs();
  }

  async function handleApply(jobId) {
    if (!isAuthenticated) {
      showToast('Please log in as a worker to apply.', 'error');
      return;
    }

    if (!isWorker) {
      showToast('Only worker accounts can apply to jobs.', 'error');
      return;
    }

    setApplyingId(jobId);

    try {
      await jobService.apply(jobId, {});
      showToast('Application submitted successfully');
    } catch (applyError) {
      showToast(getErrorMessage(applyError, 'Unable to apply for this job.'), 'error');
    } finally {
      setApplyingId('');
    }
  }

  async function handleCreateJob(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      showToast('Please log in as a client to post a job.', 'error');
      return;
    }

    if (!isClientOrAdmin) {
      showToast('Only client accounts can post jobs.', 'error');
      return;
    }

    const validationError = validateJobForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const createdJob = await jobService.create({
        categoryId: jobForm.categoryId,
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        skillsRequired: jobForm.skillsRequired
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        location: {
          addressLine: jobForm.addressLine.trim(),
          city: jobForm.city.trim(),
          state: jobForm.state.trim(),
          pincode: jobForm.pincode.trim(),
        },
        budgetType: jobForm.budgetType,
        budgetMin: Number(jobForm.budgetMin || 0),
        budgetMax: Number(jobForm.budgetMax || 0),
        urgency: jobForm.urgency,
        scheduledDate: jobForm.scheduledDate
          ? new Date(jobForm.scheduledDate).toISOString()
          : undefined,
      });

      setJobs((current) => [createdJob, ...current]);
      setJobForm((current) => ({
        ...current,
        title: '',
        description: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        budgetMin: '',
        budgetMax: '',
        scheduledDate: '',
        skillsRequired: '',
      }));
      showToast('Job posted successfully');
    } catch (createError) {
      showToast(getErrorMessage(createError, 'Unable to create the job.'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-app py-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-heading-1 text-dark font-bold">
            {isWorker
              ? 'Find work opportunities'
              : isClientOrAdmin
                ? 'Post and manage jobs'
                : 'Find work and post jobs'}
          </h1>
          <p className="mt-3 text-body-lg text-slate-500 max-w-2xl">
            {isWorker
              ? 'Apply to open opportunities that match your skills.'
              : isClientOrAdmin
                ? 'Create jobs with complete details and hire workers faster.'
                : 'Workers can apply to open opportunities, and clients can post jobs.'}
          </p>
        </div>

        <div className="flex gap-3">
          {isClientOrAdmin && (
            <Link to="/workers">
              <Button variant="ghost" size="lg">
                Find Workers
              </Button>
            </Link>
          )}
          {!isAuthenticated && (
            <Link to="/register?role=worker">
              <Button variant="primary" size="lg">
                Join as worker
              </Button>
            </Link>
          )}
        </div>
      </div>

      <form
        className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleFilterSubmit}
      >
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_auto_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
              placeholder="Search jobs by title, description, or skill"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </label>

          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
            value={filters.categoryId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, categoryId: event.target.value }))
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.openOnly}
              onChange={(event) =>
                setFilters((current) => ({ ...current, openOnly: event.target.checked }))
              }
            />
            Open only
          </label>

          <Button type="submit" variant="primary" size="lg" className="justify-center">
            Search
          </Button>
        </div>
      </form>

      {isClientOrAdmin && (
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Post a new job</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill all required details to create a valid job post.
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateJob}>
            <input
              type="text"
              required
              minLength={3}
              placeholder="Job title"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.title}
              onChange={(event) => setJobForm((current) => ({ ...current, title: event.target.value }))}
            />
            <select
              required
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.categoryId}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <textarea
              required
              minLength={10}
              placeholder="Describe the job"
              className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
              value={jobForm.description}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, description: event.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Address line"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
              value={jobForm.addressLine}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, addressLine: event.target.value }))
              }
            />

            <input
              type="text"
              required
              placeholder="City"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.city}
              onChange={(event) => setJobForm((current) => ({ ...current, city: event.target.value }))}
            />
            <input
              type="text"
              required
              placeholder="State"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.state}
              onChange={(event) => setJobForm((current) => ({ ...current, state: event.target.value }))}
            />

            <input
              type="text"
              placeholder="Pincode"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.pincode}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, pincode: event.target.value }))
              }
            />

            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.budgetType}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, budgetType: event.target.value }))
              }
            >
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.urgency}
              onChange={(event) => setJobForm((current) => ({ ...current, urgency: event.target.value }))}
            >
              <option value="low">Low urgency</option>
              <option value="medium">Medium urgency</option>
              <option value="high">High urgency</option>
            </select>

            <input
              type="number"
              min="0"
              placeholder="Budget minimum"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.budgetMin}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, budgetMin: event.target.value }))
              }
            />
            <input
              type="number"
              min="0"
              placeholder="Budget maximum"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              value={jobForm.budgetMax}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, budgetMax: event.target.value }))
              }
            />

            <input
              type="datetime-local"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
              value={jobForm.scheduledDate}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, scheduledDate: event.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Skills required, comma separated"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
              value={jobForm.skillsRequired}
              onChange={(event) =>
                setJobForm((current) => ({ ...current, skillsRequired: event.target.value }))
              }
            />

            <div className="md:col-span-2">
              <Button type="submit" variant="primary" size="lg" loading={submitting}>
                Post Job
              </Button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
          No jobs matched those filters.
        </div>
      ) : (
        <div className="mt-10 grid gap-6">
          {jobs.map((job) => (
            <article
              key={job._id}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                      {job.categoryId?.name || 'General'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {job.status}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold text-slate-900">{job.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{job.description}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Briefcase size={16} />
                      {job.clientId?.fullName || 'Client'}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} />
                      {job.location?.city}, {job.location?.state}
                    </span>
                    <span>{formatBudget(job)}</span>
                    <span>{job.applicationCount || 0} applications</span>
                  </div>

                  {(job.skillsRequired || []).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {job.skillsRequired.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 lg:w-48">
                  {isWorker ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="justify-center"
                      loading={applyingId === job._id}
                      onClick={() => handleApply(job._id)}
                    >
                      Apply now
                    </Button>
                  ) : isClientOrAdmin ? (
                    <Link to="/workers">
                      <Button variant="outline" size="lg" className="w-full justify-center">
                        Hire a worker
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button variant="primary" size="lg" className="w-full justify-center">
                        Log in to apply
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
