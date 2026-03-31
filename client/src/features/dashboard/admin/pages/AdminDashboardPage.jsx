import { useEffect, useRef, useState } from 'react';
import { BarChart3, Briefcase, CheckCircle, Shield } from 'lucide-react';
import { bookingService, jobService } from '@services';

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

export default function AdminDashboardPage() {
  const hasLoadedRef = useRef(false);
  const [jobs, setJobs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    async function bootstrap() {
      try {
        const [jobList, bookingList] = await Promise.all([
          jobService.getAll({ limit: 50 }),
          bookingService.getAll({ limit: 50 }),
        ]);

        setJobs(jobList);
        setBookings(bookingList);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const stats = [
    {
      label: 'Total Jobs',
      value: jobs.length,
      icon: Briefcase,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      label: 'Open Jobs',
      value: jobs.filter((job) => job.status === 'open').length,
      icon: Shield,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      label: 'Completed Bookings',
      value: bookings.filter((booking) => booking.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-violet-500 bg-violet-50',
    },
    {
      label: 'Gross Volume',
      value: formatCurrency(bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0)),
      icon: BarChart3,
      color: 'text-amber-500 bg-amber-50',
    },
  ];

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-dark">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Platform overview and recent marketplace activity</p>
      </div>

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
          <h3 className="text-lg font-semibold text-slate-900">Recent jobs</h3>
          <div className="mt-5 space-y-4">
            {jobs.length > 0 ? (
              jobs.slice(0, 5).map((job) => (
                <article key={job._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.clientId?.fullName || 'Client'} • {job.categoryId?.name || 'General'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {job.status}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No jobs available yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent bookings</h3>
          <div className="mt-5 space-y-4">
            {bookings.length > 0 ? (
              bookings.slice(0, 5).map((booking) => (
                <article key={booking._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.clientId?.fullName || 'Client'} to {booking.workerId?.fullName || 'Worker'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {booking.status}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No bookings available yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
