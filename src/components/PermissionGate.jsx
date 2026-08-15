import React from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/permissions';

/**
 * PermissionGate Component
 * Conditionally renders children based on the user's role and allowed roles/permissions.
 * 
 * @param {string[]} allowedRoles - List of roles permitted to see the content.
 * @param {React.ReactNode} children - The content to protect.
 * @param {React.ReactNode} fallback - Optional content to show if access is denied.
 */
const PermissionGate = ({ allowedRoles = [], children, fallback = null }) => {
    const { user, role, roles } = useAuth();
    const activeRoles = [user?.role, role, ...(Array.isArray(roles) ? roles : [])].filter(Boolean);

    if (canAccess(activeRoles, allowedRoles)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default PermissionGate;
