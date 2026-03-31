import { Outlet } from 'react-router-dom';
import Logo from '@components/common/Logo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Logo variant="white" size="lg" />
          <h2 className="mt-8 text-3xl font-bold text-white">
            Find Skilled Professionals Instantly
          </h2>
          <p className="mt-4 text-slate-400 text-body-lg">
            Connect with 50,000+ verified workers. Hire smarter. Earn better.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
