import { Navigate, useLocation } from 'react-router-dom';
import { useAuthCheck } from '@/utils/AuthUtils';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthCheck();
  const location = useLocation();

  // Save the current path for redirecting after login
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Store the attempted URL to redirect after login
      localStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [isAuthenticated, loading, location]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">Verifying authentication...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your experience</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Render the protected component if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
