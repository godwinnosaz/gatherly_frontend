import { useState, useEffect } from 'react';
import api from '../api/axios';

export const useIntelligence = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIntel = async () => {
        setLoading(true);
        try {
            const response = await api.get('/intelligence/command-center');
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching intelligence', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntel();
    }, []);

    return { data, loading, error, refetch: fetchIntel };
};
