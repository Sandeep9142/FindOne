import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Logo from '@components/common/Logo';
import { FOOTER_LINKS, SOCIAL_LINKS } from '@data/navigation';
import { useUIStore } from '@store';

export default function Footer() {
  const [email, setEmail] = useState('');
  const showToast = useUIStore((state) => state.showToast);

  function handleSubscribe(event) {
    event.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      showToast('Enter a valid email address first.', 'error');
      return;
    }

    showToast('Thanks. We will keep you posted.');
    setEmail('');
  }

  return (
    <footer className="bg-dark text-slate-400">
      <div className="border-b border-white/5">
        <div className="container-app py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Stay in the loop</h3>
              <p className="mt-1 text-sm text-slate-400">
                Get updates on new features and marketplace insights.
              </p>
            </div>

            <form className="flex w-full gap-2 md:w-auto" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 md:w-64"
              />
              <button className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600">
                Subscribe
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container-app py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo variant="white" />
            <p className="mt-4 max-w-[260px] text-sm leading-relaxed">
              Find skilled professionals instantly. AI-powered matching connecting you with
              verified workers.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <span className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} FindOne. All rights reserved.
          </span>
          <span className="text-sm text-slate-500">Built for workers and clients across India.</span>
        </div>
      </div>
    </footer>
  );
}
