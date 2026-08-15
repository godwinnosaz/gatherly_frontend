/**
 * Role-Based Access Control (RBAC) & Permission Utilities
 * Single source of truth for role hierarchies, permission groups, and access checking.
 */

export const ROLES = {
    PLATFORM_ADMIN: 'platform_admin',
    SUPER_ADMIN: 'super_admin',
    FELLOWSHIP_ADMIN: 'fellowship_admin',
    PASTOR: 'pastor',
    PRESIDENT: 'president',
    SECRETARY: 'secretary',
    FINANCE_OFFICER: 'finance_officer',
    LEADERSHIP_COMMITTEE: 'leadership_committee',
    UNIT_HEAD: 'unit_head',
    DEPARTMENT_LEADER: 'department_leader',
    EXECUTIVE: 'executive',
    GENERAL_MEMBER: 'general_member',
    MEMBER: 'member',
    USER: 'user'
};

/**
 * Standard Role Groups for common feature access gating
 */
export const ROLE_GROUPS = {
    // Global platform admin
    PLATFORM: [ROLES.PLATFORM_ADMIN],

    // High-level system & fellowship administration
    ADMINS: [
        ROLES.PLATFORM_ADMIN,
        ROLES.SUPER_ADMIN,
        ROLES.FELLOWSHIP_ADMIN
    ],

    // Executive oversight (pastors, presidents, admins)
    EXECUTIVES: [
        ROLES.PLATFORM_ADMIN,
        ROLES.SUPER_ADMIN,
        ROLES.FELLOWSHIP_ADMIN,
        ROLES.PASTOR,
        ROLES.PRESIDENT,
        ROLES.EXECUTIVE
    ],

    // Finance operations & ledger access
    FINANCE: [
        ROLES.PLATFORM_ADMIN,
        ROLES.SUPER_ADMIN,
        ROLES.FELLOWSHIP_ADMIN,
        ROLES.PRESIDENT,
        ROLES.FINANCE_OFFICER
    ],

    // Approval workflow sign-off authorities
    APPROVERS: [
        ROLES.PLATFORM_ADMIN,
        ROLES.SUPER_ADMIN,
        ROLES.FELLOWSHIP_ADMIN,
        ROLES.PRESIDENT,
        ROLES.SECRETARY,
        ROLES.FINANCE_OFFICER,
        ROLES.EXECUTIVE
    ],

    // Department/Unit leadership & attendance takers
    LEADERS: [
        ROLES.PLATFORM_ADMIN,
        ROLES.SUPER_ADMIN,
        ROLES.FELLOWSHIP_ADMIN,
        ROLES.PASTOR,
        ROLES.PRESIDENT,
        ROLES.SECRETARY,
        ROLES.FINANCE_OFFICER,
        ROLES.LEADERSHIP_COMMITTEE,
        ROLES.UNIT_HEAD,
        ROLES.DEPARTMENT_LEADER,
        ROLES.EXECUTIVE
    ]
};

/**
 * Normalizes a role string or array of roles into a clean Set of role strings
 * @param {string|string[]} rolesInput 
 * @returns {Set<string>}
 */
export const normalizeRoles = (rolesInput) => {
    if (!rolesInput) return new Set();
    if (rolesInput instanceof Set) return rolesInput;
    if (Array.isArray(rolesInput)) {
        return new Set(rolesInput.filter(Boolean).map(r => String(r).trim().toLowerCase()));
    }
    return new Set([String(rolesInput).trim().toLowerCase()]);
};

/**
 * Checks if a user has access based on allowed roles.
 * Platform admins bypass all role restrictions.
 * 
 * @param {string|string[]} userRoles - User's role(s) from AuthContext
 * @param {string[]} allowedRoles - List of allowed roles for the resource/feature
 * @returns {boolean}
 */
export const canAccess = (userRoles, allowedRoles = []) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    
    const activeRoles = normalizeRoles(userRoles);
    
    // Platform admins have unconditional super-user access
    if (activeRoles.has(ROLES.PLATFORM_ADMIN)) {
        return true;
    }

    // Check if user has any of the allowed roles
    return allowedRoles.some(role => activeRoles.has(String(role).trim().toLowerCase()));
};

/**
 * Checks if a user has permission for a specific module or feature area.
 * 
 * @param {string|string[]} userRoles 
 * @param {'finance'|'approvals'|'members'|'attendance'|'units'|'settings'|'platform'} feature 
 * @returns {boolean}
 */
export const hasFeaturePermission = (userRoles, feature) => {
    switch (feature) {
        case 'platform':
            return canAccess(userRoles, ROLE_GROUPS.PLATFORM);
        case 'settings':
            return canAccess(userRoles, ROLE_GROUPS.ADMINS);
        case 'finance':
            return canAccess(userRoles, ROLE_GROUPS.FINANCE);
        case 'approvals':
            return canAccess(userRoles, ROLE_GROUPS.APPROVERS);
        case 'members':
        case 'attendance':
        case 'units':
            return canAccess(userRoles, ROLE_GROUPS.LEADERS);
        default:
            return true;
    }
};

/**
 * Maps a user role to the appropriate dashboard type
 * @param {string} role 
 * @returns {'platform'|'fellowship'|'pastor'|'leader'|'member'}
 */
export const getDashboardType = (role) => {
    const r = String(role || '').trim().toLowerCase();
    
    if (r === ROLES.PLATFORM_ADMIN) return 'platform';
    if (r === ROLES.PASTOR) return 'pastor';
    
    if ([
        ROLES.SUPER_ADMIN, 
        ROLES.FELLOWSHIP_ADMIN, 
        ROLES.PRESIDENT, 
        ROLES.SECRETARY, 
        ROLES.FINANCE_OFFICER,
        ROLES.EXECUTIVE
    ].includes(r)) {
        return 'fellowship';
    }

    if ([
        ROLES.UNIT_HEAD, 
        ROLES.DEPARTMENT_LEADER, 
        ROLES.LEADERSHIP_COMMITTEE
    ].includes(r)) {
        return 'leader';
    }

    return 'member';
};
