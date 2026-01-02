import { UserRole } from './types';

/**
 * Centralized role-based routing configuration
 * Ensures all redirects use the same routes
 */
export const roleRoutes: Record<UserRole, string> = {
  admin: '/admin',
  teacher: '/teacher',
  headteacher: '/headteacher',
  burser: '/burser',
  store: '/store',
  dormitory: '/dormitory',
};

/**
 * Get the dashboard route for a given role
 * @param role - The user's role
 * @returns The dashboard route for the role, or '/login' as fallback
 */
export const getRoleDashboard = (role: UserRole | string | undefined): string => {
  if (!role) return '/login';
  return roleRoutes[role as UserRole] || '/login';
};

/**
 * Check if a route belongs to a specific role
 * @param pathname - The current pathname
 * @param role - The user's role
 * @returns True if the route belongs to the role
 */
export const isRoleRoute = (pathname: string, role: UserRole): boolean => {
  const roleRoute = roleRoutes[role];
  return pathname.startsWith(roleRoute);
};

