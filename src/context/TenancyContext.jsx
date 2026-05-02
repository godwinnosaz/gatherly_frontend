import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const TenancyContext = createContext();

export const TenancyProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null);
    const [branding, setBranding] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenancy = async () => {
            // For MVP, we extract tenant context from the URL slug or a static ID
            // In production, this would be based on subdomains or domain mapping
            const tenantSlug = window.location.hostname.split('.')[0];
            
            try {
                // If we're on a subdomain, fetch that specific tenant
                // Otherwise fallback to a default demo tenant
                const response = await api.get(`/tenants/branding?slug=${tenantSlug === 'localhost' ? 'demo' : tenantSlug}`);
                setTenant(response.data.tenant);
                setBranding(response.data.branding);
                
                // Apply branding to CSS variables
                if (response.data.branding) {
                    const { primary_color, secondary_color } = response.data.branding;
                    document.documentElement.style.setProperty('--color-primary', primary_color);
                    document.documentElement.style.setProperty('--color-secondary', secondary_color);
                }
            } catch (error) {
                console.error('Tenancy context error', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTenancy();
    }, []);

    return (
        <TenancyContext.Provider value={{ tenant, branding, loading }}>
            {children}
        </TenancyContext.Provider>
    );
};

export const useTenancy = () => useContext(TenancyContext);
