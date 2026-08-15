import React, { createContext, useContext, useState } from 'react';

/**
 * TenancyContext — previously called GET /tenants/branding.
 *
 * TODO (backend): Re-enable tenant branding once the backend implements:
 *   GET /tenants/branding?slug={slug}
 * which should return: { tenant: {...}, branding: { primary_color, secondary_color } }
 *
 * Until then, the context provides safe null defaults so no component crashes.
 */
const TenancyContext = createContext();

export const TenancyProvider = ({ children }) => {
    const [tenant]   = useState(null);
    const [branding] = useState(null);
    const [loading]  = useState(false);

    // Tenant branding fetch is DISABLED — not in Postman contract.
    // Re-enable once GET /tenants/branding is documented and available:
    //
    // useEffect(() => {
    //     const fetchTenancy = async () => {
    //         const tenantSlug = window.location.hostname.split('.')[0];
    //         try {
    //             const response = await api.get(`/tenants/branding?slug=${tenantSlug}`);
    //             setTenant(response.tenant);
    //             setBranding(response.branding);
    //             if (response.branding) {
    //                 document.documentElement.style.setProperty('--color-primary', response.branding.primary_color);
    //                 document.documentElement.style.setProperty('--color-secondary', response.branding.secondary_color);
    //             }
    //         } catch (error) {
    //             console.error('Tenancy context error', error);
    //         }
    //     };
    //     fetchTenancy();
    // }, []);

    return (
        <TenancyContext.Provider value={{ tenant, branding, loading }}>
            {children}
        </TenancyContext.Provider>
    );
};

export const useTenancy = () => useContext(TenancyContext);
