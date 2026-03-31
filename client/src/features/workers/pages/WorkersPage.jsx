import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, ShieldCheck, Star } from 'lucide-react';
import Button from '@components/common/Button';
import { categoryService, workerService } from '@services';
import { useAuthStore } from '@store';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function WorkersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const loadKeyRef = useRef('');
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: '',
    availableNow: searchParams.get('availableNow') === 'true',
  });
  const user = useAuthStore((state) => state.user);

  async function loadWorkers(currentFilters = filters) {
    setLoading(true);
    setError('');

    try {
      const nextQuery = {
        q: currentFilters.q || undefined,
        category: currentFilters.category || undefined,
        availableNow: currentFilters.availableNow ? 'true' : undefined,
        limit: 24,
      };
      const result = await workerService.getAll(nextQuery);
      setWorkers(result);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load workers right now.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const queryKey = searchParams.toString();
    if (loadKeyRef.current === queryKey) {
      return;
    }

    loadKeyRef.current = queryKey;

    async function bootstrap() {
      try {
        const categoryList = await categoryService.getAll();
        const categoryParam = searchParams.get('category');
        const resolvedCategoryId = categoryParam
          ? categoryList.find(
              (category) => category.slug === categoryParam || category._id === categoryParam
            )?._id || ''
          : '';
        const nextFilters = {
          q: searchParams.get('q') || '',
          category: resolvedCategoryId,
          availableNow: searchParams.get('availableNow') === 'true',
        };
        const workerList = await workerService.getAll({
          q: nextFilters.q || undefined,
          category: nextFilters.category || undefined,
          availableNow: nextFilters.availableNow ? 'true' : undefined,
          limit: 24,
        });

        setCategories(categoryList);
        setFilters(nextFilters);
        setWorkers(workerList);
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load workers right now.'));
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [searchParams]);

  function handleSubmit(event) {
    event.preventDefault();
    const nextSearchParams = new URLSearchParams({
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.availableNow ? { availableNow: 'true' } : {}),
      ...(filters.category
        ? {
            category:
              categories.find((category) => category._id === filters.category)?.slug || filters.category,
          }
        : {}),
    });

    if (nextSearchParams.toString() === searchParams.toString()) {
      loadWorkers(filters);
      return;
    }

    setSearchParams(nextSearchParams);
  }

  return (
    <div className="container-app py-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-heading-1 text-dark font-bold">Hire verified workers</h1>
          <p className="mt-3 text-body-lg text-slate-500 max-w-2xl">
            Browse skilled professionals, check reviews, and move directly into booking when you
            find the right match.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/jobs">
            <Button variant="ghost" size="lg">
              Browse Jobs
            </Button>
          </Link>
          {!user && (
            <Link to="/register?role=client">
              <Button variant="primary" size="lg">
                Create client account
              </Button>
            </Link>
          )}
        </div>
      </div>

      <form
        className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_auto_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
              placeholder="Search by skill, name, or service"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </label>

          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
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
              checked={filters.availableNow}
              onChange={(event) =>
                setFilters((current) => ({ ...current, availableNow: event.target.checked }))
              }
            />
            Available now
          </label>

          <Button type="submit" variant="primary" size="lg" className="justify-center">
            Search
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
          Loading workers...
        </div>
      ) : workers.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
          No workers matched those filters yet.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {workers.map((worker) => {
            const displayName = worker.userId?.fullName || 'Worker';
            const location = worker.serviceAreas?.[0]
              ? `${worker.serviceAreas[0].city}, ${worker.serviceAreas[0].state}`
              : 'Location shared after booking';

            return (
              <article
                key={worker._id}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-lg font-bold text-primary-700">
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-slate-900">{displayName}</h2>
                      {worker.userId?.isVerified && (
                        <ShieldCheck size={16} className="text-emerald-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {worker.headline || 'Ready to help with local services'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    <Star size={14} className="fill-current" />
                    {worker.ratingAverage?.toFixed?.(1) || '0.0'} ({worker.ratingCount || 0})
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    Rs {worker.hourlyRate || 0}/hr
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {location}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(worker.categories || []).slice(0, 4).map((category) => (
                    <span
                      key={category._id}
                      className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>

                <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600">
                  {worker.bio || 'This worker has not added a detailed bio yet.'}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {worker.isAvailableNow ? 'Available now' : 'Schedule ahead'}
                  </span>
                  <Link to={`/worker/${worker._id}`}>
                    <Button variant="primary" size="sm">
                      View profile
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
