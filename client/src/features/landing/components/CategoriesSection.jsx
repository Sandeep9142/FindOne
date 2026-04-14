import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarHeart,
  Droplets,
  GraduationCap,
  MapPin,
  Monitor,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeader from '@components/common/SectionHeader';
import Button from '@components/common/Button';
import { categoryService, workerService } from '@services';
import { cn } from '@utils/cn';

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-100', ring: 'group-hover:ring-blue-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-100', ring: 'group-hover:ring-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'group-hover:bg-amber-100', ring: 'group-hover:ring-amber-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'group-hover:bg-pink-100', ring: 'group-hover:ring-pink-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'group-hover:bg-violet-100', ring: 'group-hover:ring-violet-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-100', ring: 'group-hover:ring-emerald-200' },
};

const colorOrder = ['blue', 'green', 'amber', 'pink', 'violet', 'emerald'];

const iconByName = {
  Wrench,
  Sparkles,
  Zap,
  Droplets,
  CalendarHeart,
  GraduationCap,
  Truck,
  Monitor,
};

const FALLBACK_CATEGORIES = [
  { _id: 'fallback-electrical', name: 'Electrical', slug: 'electrical', icon: 'Zap', workerCount: 48, isFallback: true },
  { _id: 'fallback-plumbing', name: 'Plumbing', slug: 'plumbing', icon: 'Droplets', workerCount: 36, isFallback: true },
  { _id: 'fallback-home-repair', name: 'Home Repair', slug: 'home-repair', icon: 'Wrench', workerCount: 41, isFallback: true },
  { _id: 'fallback-cleaning', name: 'Cleaning', slug: 'cleaning', icon: 'Sparkles', workerCount: 52, isFallback: true },
  { _id: 'fallback-moving', name: 'Moving', slug: 'moving', icon: 'Truck', workerCount: 19, isFallback: true },
  { _id: 'fallback-tutoring', name: 'Tutoring', slug: 'tutoring', icon: 'GraduationCap', workerCount: 27, isFallback: true },
  { _id: 'fallback-event-support', name: 'Event Support', slug: 'event-support', icon: 'CalendarHeart', workerCount: 14, isFallback: true },
  { _id: 'fallback-tech-help', name: 'Tech Help', slug: 'tech-help', icon: 'Monitor', workerCount: 23, isFallback: true },
];

const FALLBACK_WORKERS_BY_CATEGORY = {
  'fallback-electrical': [
    { _id: 'demo-ele-1', headline: 'Wiring, fan repair, and fitting specialist', hourlyRate: 280, ratingAverage: 4.8, serviceAreas: [{ city: 'Bhubaneswar', state: 'Odisha' }], userId: { fullName: 'Raju Sharma', isVerified: true }, isFallback: true },
    { _id: 'demo-ele-2', headline: 'Experienced electrician for home services', hourlyRate: 260, ratingAverage: 4.6, serviceAreas: [{ city: 'Cuttack', state: 'Odisha' }], userId: { fullName: 'Manoj Behera', isVerified: true }, isFallback: true },
  ],
  'fallback-plumbing': [
    { _id: 'demo-plu-1', headline: 'Tap leakage and bathroom fitting expert', hourlyRate: 240, ratingAverage: 4.7, serviceAreas: [{ city: 'Kolkata', state: 'West Bengal' }], userId: { fullName: 'Sourav Das', isVerified: true }, isFallback: true },
    { _id: 'demo-plu-2', headline: 'Kitchen and pipeline maintenance specialist', hourlyRate: 250, ratingAverage: 4.5, serviceAreas: [{ city: 'Howrah', state: 'West Bengal' }], userId: { fullName: 'Amit Mondal', isVerified: false }, isFallback: true },
  ],
  'fallback-home-repair': [
    { _id: 'demo-hom-1', headline: 'General home repair and fixture setup', hourlyRate: 230, ratingAverage: 4.4, serviceAreas: [{ city: 'Ranchi', state: 'Jharkhand' }], userId: { fullName: 'Deepak Kumar', isVerified: true }, isFallback: true },
    { _id: 'demo-hom-2', headline: 'Quick wall, hinge, and furniture repairs', hourlyRate: 220, ratingAverage: 4.3, serviceAreas: [{ city: 'Patna', state: 'Bihar' }], userId: { fullName: 'Nitesh Singh', isVerified: false }, isFallback: true },
  ],
  'fallback-cleaning': [
    { _id: 'demo-cle-1', headline: 'Deep home cleaning and sanitation support', hourlyRate: 200, ratingAverage: 4.9, serviceAreas: [{ city: 'Bhopal', state: 'Madhya Pradesh' }], userId: { fullName: 'Anita Verma', isVerified: true }, isFallback: true },
    { _id: 'demo-cle-2', headline: 'Kitchen and bathroom intensive cleaning', hourlyRate: 190, ratingAverage: 4.7, serviceAreas: [{ city: 'Indore', state: 'Madhya Pradesh' }], userId: { fullName: 'Neha Yadav', isVerified: true }, isFallback: true },
  ],
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatWorkerCount(workerCount) {
  const count = Number(workerCount || 0);
  return `${count.toLocaleString()} worker${count === 1 ? '' : 's'}`;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [workers, setWorkers] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true);
      setError('');
      setNotice('');

      try {
        const categoryList = await categoryService.getAll();
        const normalizedList = Array.isArray(categoryList) && categoryList.length > 0 ? categoryList : FALLBACK_CATEGORIES;
        setCategories(normalizedList);
        setSelectedCategoryId(normalizedList[0]?._id || '');

        if (!Array.isArray(categoryList) || categoryList.length === 0) {
          setNotice('Showing sample categories while live category data is unavailable.');
        }
      } catch (fetchError) {
        setCategories(FALLBACK_CATEGORIES);
        setSelectedCategoryId(FALLBACK_CATEGORIES[0]?._id || '');
        setNotice('Showing sample categories while we reconnect to live data.');
        setError('');
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadWorkersForCategory() {
      if (!selectedCategoryId) {
        setWorkers([]);
        return;
      }

      const category = categories.find((item) => item._id === selectedCategoryId);
      const fallbackWorkers = FALLBACK_WORKERS_BY_CATEGORY[selectedCategoryId] || [];

      if (category?.isFallback) {
        setWorkers(fallbackWorkers);
        return;
      }

      setWorkersLoading(true);
      setError('');

      try {
        const workerList = await workerService.getAll({
          category: selectedCategoryId,
          limit: 6,
        });
        if (Array.isArray(workerList) && workerList.length > 0) {
          setWorkers(workerList);
        } else {
          setWorkers(fallbackWorkers);
          if (fallbackWorkers.length > 0) {
            setNotice('Showing sample worker previews for this category.');
          }
        }
      } catch (fetchError) {
        setWorkers(fallbackWorkers);
        if (fallbackWorkers.length > 0) {
          setNotice('Showing sample worker previews while live data is unavailable.');
          setError('');
        } else {
          setError(getErrorMessage(fetchError, 'Unable to load workers for this category.'));
        }
      } finally {
        setWorkersLoading(false);
      }
    }

    loadWorkersForCategory();
  }, [selectedCategoryId, categories]);

  return (
    <section className="section section--gray" id="categories">
      <div className="container-app">
        <SectionHeader
          overline="CATEGORIES"
          title="Browse by service category"
          subtitle="Fetch workers category-wise, see live worker counts, and preview top workers before opening the full directory."
        />

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {notice}
          </div>
        )}

        {categoriesLoading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
            No categories available right now.
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {categories.map((category, index) => {
              const Icon = iconByName[category.icon] || Wrench;
              const colorKey = colorOrder[index % colorOrder.length];
              const theme = colorMap[colorKey] || colorMap.blue;
              const isSelected = selectedCategoryId === category._id;

              return (
                <motion.div key={category._id} variants={cardVariants}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(category._id)}
                    className={cn(
                      'group block w-full rounded-2xl border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg lg:p-6',
                      isSelected
                        ? 'border-primary-300 ring-2 ring-primary-100'
                        : 'border-slate-100 hover:border-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-0 ring-transparent transition-all duration-300 group-hover:scale-110 group-hover:ring-4',
                        theme.bg,
                        theme.text,
                        theme.hover,
                        theme.ring
                      )}
                    >
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-bold text-dark transition-colors group-hover:text-primary-600">
                      {category.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatWorkerCount(category.workerCount)}</span>
                      <ArrowRight
                        size={14}
                        className="text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary-500"
                      />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {selectedCategory ? `${selectedCategory.name} workers` : 'Workers'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedCategory
                  ? `${formatWorkerCount(selectedCategory.workerCount)} available in this category.`
                  : 'Select a category to see workers.'}
              </p>
            </div>

            {selectedCategory && (
              <Link to={`/workers?category=${selectedCategory.slug}`}>
                <Button variant="ghost" size="sm">
                  View all in directory
                  <ArrowRight size={14} />
                </Button>
              </Link>
            )}
          </div>

          {workersLoading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Loading workers...
            </div>
          ) : workers.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-sm text-slate-500">
              No workers available in this category yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {workers.map((worker) => {
                const displayName = worker.userId?.fullName || 'Worker';
                const location = worker.serviceAreas?.[0]
                  ? `${worker.serviceAreas[0].city}, ${worker.serviceAreas[0].state}`
                  : 'Location shared on profile';

                return (
                  <article key={worker._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary-100 text-sm font-bold text-primary-700">
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
                          <h4 className="truncate text-sm font-semibold text-slate-900">{displayName}</h4>
                          {worker.userId?.isVerified && (
                            <ShieldCheck size={14} className="text-emerald-500" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {worker.headline || 'Skilled local professional'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                        <Star size={12} className="fill-current" />
                        {worker.ratingAverage?.toFixed?.(1) || '0.0'}
                      </span>
                      <span>Rs {worker.hourlyRate || 0}/hr</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {location}
                      </span>
                    </div>

                    <div className="mt-4">
                      <Link to={worker.isFallback ? `/workers?category=${selectedCategory?.slug || ''}` : `/worker/${worker._id}`}>
                        <Button variant="primary" size="sm" className="w-full justify-center">
                          {worker.isFallback ? 'View directory' : 'View profile'}
                        </Button>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to="/workers"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary-50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100"
          >
            View All Categories
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
