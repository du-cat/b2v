import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-900">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mt-4 mb-6">Page Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button
            variant="primary"
            leftIcon={<Home className="h-5 w-5" />}
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}