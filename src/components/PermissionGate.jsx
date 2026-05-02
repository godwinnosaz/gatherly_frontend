import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionGate Component
 * Conditionally renders children based on the user's role and allowed roles/permissions.
 * 
 * @param {string[]} allowedRoles - List of roles permitted to see the content.
 * @param {React.ReactNode} children - The content to protect.
 * @param {React.ReactNode} fallback - Optional content to show if access is denied.
 */
const PermissionGate = ({ allowedRoles = [], children, fallback = null }) => {
    const { user } = useAuth();

    // Platform admins see everything
    if (user?.role === 'platform_admin') {
        return <>{children}</>;
    }

    const hasPermission = allowedRoles.includes(user?.role);

    if (hasPermission) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default PermissionGate;
