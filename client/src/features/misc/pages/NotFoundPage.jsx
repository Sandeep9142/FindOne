import { Link } from 'react-router-dom';
import Button from '@components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <span className="text-8xl font-extrabold text-primary-500">404</span>
        <h1 className="mt-4 text-2xl font-bold text-dark">Page not found</h1>
        <p className="mt-2 text-slate-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="primary" size="lg">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
