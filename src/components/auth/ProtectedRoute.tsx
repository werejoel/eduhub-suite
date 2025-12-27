import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email confirmation (admin is always allowed)
  if (!user.email_confirmed && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="mb-4">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Email Not Confirmed</h2>
          <p className="text-muted-foreground mb-4">
            Your email address has not been confirmed by an administrator yet. 
            Please contact your administrator to confirm your account.
          </p>
          <Button onClick={() => navigate('/login')}>Back to Login</Button>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRoutes: Record<UserRole, string> = {
      admin: '/admin',
      teacher: '/teacher',
      headteacher: '/headteacher',
      burser: '/burser',
    };
    
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
};

