import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { registerAuthLogoutHandler } from '../api/axios';

export const getOnboardingKey = (user, tenant) => {
    const tenantId = tenant?.id || tenant?.tenant_id || user?.tenant_id || user?.organization_id;
    const userId = user?.id;
    if (!tenantId || !userId) return null;
    return `gatherly_onboarding_complete:${tenantId}:${userId}`;
};

const AuthContext = createContext();

const parseRobustJson = (response) => {
    if (typeof response === 'string') {
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonStr = response.substring(jsonStart, jsonEnd + 1);
            try {
                return JSON.parse(jsonStr);
            } catch {
                if (response.includes('"status":false') || response.includes('"success":false')) {
                    return { status: false, message: response };
                }
            }
        } else if (response.includes('Warning') || response.includes('Fatal error') || response.includes('SQLSTATE')) {
            return { status: false, message: response };
        }
    }
    return response;
};

const normalizeAuthResponse = (rawResponse) => {
    const response = parseRobustJson(rawResponse);
    if (!response) return null;
    
    // Check if nested inside data
    const data = response.data || response;
    
    // Retrieve token
    const token = data.token || data.access_token || response.token || response.access_token || localStorage.getItem('gatherly_token');
    
    // Retrieve user
    const user = data.user || response.user || (data.email ? data : null);
    
    // Retrieve tenant
    const tenant = data.tenant || response.tenant || data.organization || response.organization || null;
    
    // Retrieve role
    const role = data.role || response.role || user?.role || 'member';
    
    // Retrieve roles
    const roles = data.roles || response.roles || (role ? [role] : []);

    return {
        token,
        user: user ? { ...user, role } : null,
        tenant,
        role,
        roles
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const cached = localStorage.getItem('gatherly_user');
        return cached ? JSON.parse(cached) : null;
    });
    const [role, setRole] = useState(() => {
        return localStorage.getItem('gatherly_role') || null;
    });
    const [roles, setRoles] = useState(() => {
        const cached = localStorage.getItem('gatherly_roles');
        return cached ? JSON.parse(cached) : [];
    });
    const [tenant, setTenant] = useState(() => {
        const cached = localStorage.getItem('gatherly_tenant');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const isOnboardingComplete = useCallback((u, t = null) => {
        const currentUser = u || user;
        if (!currentUser) return false;

        // Prefer backend value if available from user, organization or tenant
        const backendComplete = 
            currentUser.onboarding_completed === 1 || currentUser.onboarding_completed === true ||
            currentUser.organization?.onboarding_completed === 1 || currentUser.organization?.onboarding_completed === true ||
            currentUser.tenant?.onboarding_completed === 1 || currentUser.tenant?.onboarding_completed === true ||
            t?.onboarding_completed === 1 || t?.onboarding_completed === true;

        if (backendComplete) return true;

        // Fallback to scoped localStorage
        const key = getOnboardingKey(currentUser, t || tenant);
        return key ? localStorage.getItem(key) === 'true' : false;
    }, [user, tenant]);

    const saveAuthState = useCallback((normalized) => {
        if (!normalized) return;
        
        const completed = isOnboardingComplete(normalized.user, normalized.tenant);
        const updatedUser = normalized.user ? {
            ...normalized.user,
            onboarding_completed: completed
        } : null;
        
        if (normalized.token) {
            localStorage.setItem('gatherly_token', normalized.token);
        }
        if (updatedUser) {
            localStorage.setItem('gatherly_user', JSON.stringify(updatedUser));
        }
        if (normalized.tenant) {
            localStorage.setItem('gatherly_tenant', JSON.stringify(normalized.tenant));
        }
        if (normalized.role) {
            localStorage.setItem('gatherly_role', normalized.role);
        }
        if (normalized.roles) {
            localStorage.setItem('gatherly_roles', JSON.stringify(normalized.roles));
        }
        
        setUser(updatedUser);
        setRole(normalized.role);
        setRoles(normalized.roles);
        setTenant(normalized.tenant);
    }, [isOnboardingComplete]);

    const logout = useCallback(() => {
        localStorage.removeItem('gatherly_token');
        localStorage.removeItem('gatherly_user');
        localStorage.removeItem('gatherly_tenant');
        localStorage.removeItem('gatherly_role');
        localStorage.removeItem('gatherly_roles');
        localStorage.removeItem('gatherly_onboarding_complete');
        
        // Clean all onboarding keys
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('gatherly_onboarding_complete') || key.includes('onboarding')) {
                localStorage.removeItem(key);
            }
        });
        
        setUser(null);
        setRole(null);
        setRoles([]);
        setTenant(null);
    }, []);

    useEffect(() => {
        // Register a logout handler for API-level 401 handling
        registerAuthLogoutHandler(() => {
            logout();
            navigate('/login');
        });

        const checkAuth = async () => {
            const token = localStorage.getItem('gatherly_token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    const normalized = normalizeAuthResponse(response);
                    if (normalized) {
                        saveAuthState(normalized);
                    }
                } catch (error) {
                    console.error('Session verification failed:', error);
                    if (error?.status === 401 || error?.type === 'unauthenticated') {
                        logout();
                    } else {
                        // Restore session from cache to preserve UI state
                        const cachedUser = localStorage.getItem('gatherly_user');
                        const cachedRole = localStorage.getItem('gatherly_role');
                        const cachedRoles = localStorage.getItem('gatherly_roles');
                        const cachedTenant = localStorage.getItem('gatherly_tenant');
                        
                        if (cachedUser) {
                            try {
                                const parsedUser = JSON.parse(cachedUser);
                                const parsedRoles = cachedRoles ? JSON.parse(cachedRoles) : [];
                                const parsedTenant = cachedTenant ? JSON.parse(cachedTenant) : null;
                                const completed = isOnboardingComplete(parsedUser, parsedTenant);
                                
                                setUser({
                                    ...parsedUser,
                                    onboarding_completed: completed
                                });
                                setRole(cachedRole);
                                setRoles(parsedRoles);
                                setTenant(parsedTenant);
                            } catch (e) {
                                console.error('Failed to parse cached user', e);
                            }
                        }
                    }
                }
            } else {
                logout();
            }
            setLoading(false);
        };
        checkAuth();
        return () => registerAuthLogoutHandler(null);
    }, [navigate, isOnboardingComplete, saveAuthState, logout]);

    const login = async (email, password) => {
        const rawResponse = await api.post('/auth/login', { email, password });

        const response = parseRobustJson(rawResponse);
        const data = response.data || response;
        if (response?.status === false || response?.success === false || response?.error || data?.status === false) {
            throw {
                type: 'unauthenticated',
                message: response?.message || response?.error || data?.message || 'Invalid email or password.',
            };
        }

        const normalized = normalizeAuthResponse(response);
        if (!normalized || !normalized.token) {
            throw {
                type: 'unauthenticated',
                message: response?.message || 'Invalid email or password.',
            };
        }

        saveAuthState(normalized);
        return response;
    };

    const register = async (userData) => {
        const rawResponse = await api.post('/auth/register', userData);
        
        const response = parseRobustJson(rawResponse);
        const data = response.data || response;
        if (response?.status === false || response?.success === false || response?.error || data?.status === false) {
            throw {
                type: 'registration_failed',
                message: response?.message || response?.error || data?.message || 'Registration failed.',
            };
        }
        return response;
    };

    const completeOnboarding = useCallback(() => {
        if (user && (user.tenant_id || tenant?.id) && user.id) {
            const scopedKey = getOnboardingKey(user, tenant);
            if (scopedKey) localStorage.setItem(scopedKey, 'true');
            
            const updatedUser = { ...user, onboarding_completed: true };
            localStorage.setItem('gatherly_user', JSON.stringify(updatedUser));
        }
        setUser((prev) => prev ? { ...prev, onboarding_completed: true } : prev);
    }, [user, tenant]);

    const markOnboardingComplete = useCallback(async () => {
        if (user) {
            const scopedKey = getOnboardingKey(user, tenant);
            if (scopedKey) localStorage.setItem(scopedKey, 'true');

            // Call backend completion endpoint
            try {
                await api.post('/onboarding/complete');
            } catch (err) {
                console.error('[AuthContext] Backend complete call failed:', err);
            }

            // Sync updated state locally
            const updatedUser = { 
                ...user, 
                onboarding_completed: true,
                organization: user.organization ? { ...user.organization, onboarding_completed: true } : undefined,
                tenant: tenant ? { ...tenant, onboarding_completed: true } : undefined
            };
            localStorage.setItem('gatherly_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
    }, [user, tenant]);

    const refreshSession = useCallback(async () => {
        const token = localStorage.getItem('gatherly_token');
        if (!token) return null;
        try {
            const response = await api.get('/auth/me');
            const normalized = normalizeAuthResponse(response);
            if (normalized) {
                saveAuthState(normalized);
                return normalized.user;
            }
        } catch (error) {
            console.error('[AuthContext] Session refresh failed:', error);
        }
        return null;
    }, [saveAuthState]);

    const hasRole = useCallback((checkRole) => {
        return role === checkRole;
    }, [role]);

    const hasAnyRole = useCallback((checkRoles) => {
        return checkRoles.includes(role);
    }, [role]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            role,
            roles,
            tenant,
            loading, 
            login, 
            register, 
            logout, 
            completeOnboarding, 
            hasRole, 
            hasAnyRole, 
            isOnboardingComplete, 
            markOnboardingComplete, 
            getOnboardingKey, 
            refreshSession 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
